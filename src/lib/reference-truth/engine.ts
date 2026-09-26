import { z } from "zod";
import { truthInputSchema } from "./models";

export type Decision = "WAIT" | "MONITOR" | "PROCEED_TO_REVIEW";
export type Finding = { code: string; severity: "blocking" | "caution"; message: string };
export type TruthResult = {
  decision: Decision; mode: "live" | "synthetic" | "unknown"; findings: Finding[];
  tokenPriceAgeMs: number | null; referenceAgesMs: (number | null)[];
  observationAgeMs: number | null; normalizedTokenPrice: number | null;
  referenceConsensusPrice: number | null; normalizedGapBps: number | null;
  providerDisagreementBps: number | null; session: string;
  execution: "DISABLED";
};
const limit = z.number().finite().nonnegative();
export const policySchema = z.object({
  maxTokenAgeMs: limit, maxReferenceAgeMs: limit, maxObservationAgeMs: limit,
  maxMultiplierAgeMs: limit, minLiquidityNotional: limit, maxSlippageBps: limit,
  maxProviderDisagreementBps: limit, minGapBps: limit,
  minIndependentProviders: z.number().int().min(2),
  reviewSessions: z.array(z.enum(["premarket", "regular", "postmarket", "overnight"])).min(1),
}).strict();
export type TruthPolicy = z.infer<typeof policySchema>;
// Illustrative conservative research defaults, not calibrated trading recommendations.
export const defaultPolicy: Readonly<TruthPolicy> = Object.freeze<TruthPolicy>({
  maxTokenAgeMs: 60_000, maxReferenceAgeMs: 60_000, maxObservationAgeMs: 30_000,
  maxMultiplierAgeMs: 86_400_000, minLiquidityNotional: 10_000,
  maxSlippageBps: 50, maxProviderDisagreementBps: 25, minGapBps: 50,
  minIndependentProviders: 2, reviewSessions: ["regular"],
});

/** Pure, deterministic research gate. It has no network, wallet or execution capability. */
export function evaluateReferenceTruth(input: unknown, nowMs: number, policy: TruthPolicy = defaultPolicy): TruthResult {
  const result: TruthResult = {
    decision: "WAIT", mode: "unknown", findings: [], tokenPriceAgeMs: null,
    referenceAgesMs: [], observationAgeMs: null, normalizedTokenPrice: null,
    referenceConsensusPrice: null, normalizedGapBps: null, providerDisagreementBps: null,
    session: "unknown", execution: "DISABLED",
  };
  const warn = (code: string, message: string, severity: Finding["severity"] = "blocking") => {
    result.findings.push({ code, message, severity });
  };
  const parsed = truthInputSchema.safeParse(input);
  const config = policySchema.safeParse(policy);
  if (!parsed.success || !config.success || !Number.isFinite(nowMs) || nowMs < 0) {
    warn("INVALID_INPUT", "Evidence, evaluation time or policy is missing or invalid.");
    return result;
  }
  const d = parsed.data;
  const p = config.data;
  result.mode = d.mode;
  if (!d.available) warn("API_UNAVAILABLE", "Required market evidence is unavailable.");
  function age(time: number | undefined, max: number, field: string): number | null {
    if (time === undefined) { warn("MISSING_TIMESTAMP", `${field}: timestamp is missing.`); return null; }
    if (time > nowMs) { warn("FUTURE_TIMESTAMP", `${field}: timestamp is in the future.`); return null; }
    const value = nowMs - time;
    if (value > max) warn("STALE_EVIDENCE", `${field}: age exceeds the configured threshold.`);
    return value;
  }
  result.observationAgeMs = age(d.observedAt?.unixMs, p.maxObservationAgeMs, "Snapshot observation");
  const evidence = [d.token, d.tokenPrice, ...d.references, d.multiplier, d.session, d.liquidity, d.quote].filter(v => v !== null);
  for (const item of evidence) {
    if (item.provenance.mode !== d.mode) warn("MIXED_PROVENANCE", "Live and synthetic evidence cannot be mixed.");
    if ("observedAt" in item) {
      age(item.observedAt?.unixMs, p.maxObservationAgeMs, "Evidence observation");
      if (item.observedAt && d.observedAt && item.observedAt.unixMs > d.observedAt.unixMs) warn("TIMESTAMP_CONTRADICTION", "Evidence observation is later than the snapshot observation.");
      if ("priceAt" in item && item.priceAt && item.observedAt && item.priceAt.unixMs > item.observedAt.unixMs) warn("TIMESTAMP_CONTRADICTION", "Provider price timestamp is later than its observation.");
    }
  }
  const required = { token: d.token, underlying: d.underlying, tokenPrice: d.tokenPrice, multiplier: d.multiplier, session: d.session, order: d.order };
  for (const [key, value] of Object.entries(required)) if (!value) warn("MISSING_EVIDENCE", `${key}: required evidence is missing.`);
  if (!d.liquidity) warn("MISSING_LIQUIDITY", "Liquidity evidence is missing.");
  if (!d.quote) warn("MISSING_QUOTE", "An executable quote for this exact proposed order is missing.");
  if (d.tokenPrice) result.tokenPriceAgeMs = age(d.tokenPrice.priceAt?.unixMs, p.maxTokenAgeMs, "Token price");
  result.referenceAgesMs = d.references.map((ref, i) => age(ref.priceAt?.unixMs, p.maxReferenceAgeMs, `Underlying reference ${i + 1}`));

  let comparable = Boolean(d.token && d.underlying && d.tokenPrice && d.multiplier && d.references.length);
  const mismatch = (condition: boolean, message: string) => {
    if (condition) { comparable = false; warn("IDENTITY_OR_CURRENCY_MISMATCH", message); }
  };
  if (d.token && d.underlying) mismatch(d.token.underlyingId !== d.underlying.id, "Token and underlying equity do not match.");
  for (const item of [d.tokenPrice, d.multiplier, d.liquidity, d.quote, d.order]) {
    if (item && d.token) mismatch(item.tokenId !== d.token.id, "Evidence belongs to a different token.");
    if (item && "currency" in item && d.underlying) mismatch(item.currency !== d.underlying.currency, "Currencies differ; no FX conversion is available.");
  }
  for (const item of [...d.references, d.multiplier, d.session]) {
    if (item && d.underlying) mismatch(item.underlyingId !== d.underlying.id, "Evidence belongs to a different underlying equity.");
  }
  const independent = d.references.filter(ref => ref.basis === "independent-equity");
  if (independent.length !== d.references.length) { comparable = false; warn("TOKEN_DERIVED_REFERENCE", "Token-derived prices cannot establish an independent equity reference."); }
  const providerIds = new Set(independent.map(ref => ref.provenance.provider.id));
  if (providerIds.size !== independent.length) warn("DUPLICATE_PROVIDER", "Repeated observations from one provider are not independent corroboration.");
  if (providerIds.size < p.minIndependentProviders) warn("MISSING_CORROBORATION", "Too few distinct independent reference providers.");
  for (const ref of independent) {
    if (d.underlying) mismatch(ref.currency !== d.underlying.currency, "Reference currency differs from the equity currency.");
    if (ref.provenance.provider.id === d.tokenPrice?.provenance.provider.id || ref.provenance.provider.id === d.token?.issuer.id) warn("NONINDEPENDENT_PROVIDER", "Reference provider is also the token-price provider or issuer.");
  }
  if (d.multiplier) {
    age(d.multiplier.effectiveAtMs, p.maxMultiplierAgeMs, "Token-to-share multiplier");
    if (d.multiplier.validUntilMs <= nowMs || d.multiplier.validUntilMs <= d.multiplier.effectiveAtMs) warn("INVALID_MULTIPLIER", "Multiplier validity has expired or is contradictory.");
    if (d.multiplier.observedAt && d.multiplier.effectiveAtMs > d.multiplier.observedAt.unixMs) warn("TIMESTAMP_CONTRADICTION", "Multiplier was not effective when observed.");
  }
  if (comparable && d.tokenPrice && d.multiplier && independent.length) {
    const sorted = independent.map(r => r.price).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[middle] : sorted[middle - 1] / 2 + sorted[middle] / 2;
    const normalized = d.tokenPrice.price / d.multiplier.sharesPerToken;
    const gap = (normalized / median - 1) * 10_000;
    const disagreement = ((sorted[sorted.length - 1] - sorted[0]) / median) * 10_000;
    if (![normalized, median, gap, disagreement].every(Number.isFinite) || normalized <= 0 || median <= 0) warn("INVALID_ARITHMETIC", "Price normalization is outside the supported numeric range.");
    else {
      result.normalizedTokenPrice = normalized;
      result.referenceConsensusPrice = median;
      result.normalizedGapBps = gap;
      result.providerDisagreementBps = disagreement;
      if (disagreement > p.maxProviderDisagreementBps) warn("PROVIDER_DISAGREEMENT", "Independent providers disagree beyond the configured tolerance.");
      if (Math.abs(gap) < p.minGapBps) warn("GAP_BELOW_THRESHOLD", "The gap does not meet the configured review threshold.", "caution");
    }
  }
  if (d.session) {
    result.session = d.session.session;
    if (["halted", "unknown"].includes(d.session.session)) warn("SESSION_UNCERTAIN", "Underlying market session is halted or unknown.");
    else if (!p.reviewSessions.some(s => s === d.session!.session)) warn("SESSION_NOT_REVIEWABLE", "This market session is not enabled for review; monitor only.", "caution");
  }
  if (d.liquidity && d.order && d.tokenPrice) {
    const notional = Math.max(d.order.quantityTokens * d.tokenPrice.price, d.quote?.totalQuoteAmount ?? 0);
    if (!Number.isFinite(notional) || d.liquidity.availableNotional < Math.max(p.minLiquidityNotional, notional)) warn("INSUFFICIENT_LIQUIDITY", "Available liquidity does not cover the order and configured minimum.");
  }
  if (d.quote) {
    if (!d.quote.executable) warn("QUOTE_NOT_EXECUTABLE", "Provider reports that the quote is not executable.");
    if (d.quote.expiresAtMs <= nowMs || (d.quote.observedAt && d.quote.expiresAtMs <= d.quote.observedAt.unixMs)) warn("QUOTE_EXPIRED", "Quote validity has expired or is contradictory.");
    if (d.order && (d.quote.side !== d.order.side || d.quote.quantityTokens !== d.order.quantityTokens || d.quote.currency !== d.order.currency)) warn("QUOTE_ORDER_MISMATCH", "Quote does not match the proposed side, size and currency.");
    let adverseBps = 0;
    if (d.tokenPrice) {
      const quotedUnitPrice = d.quote.totalQuoteAmount / d.quote.quantityTokens;
      adverseBps = (d.quote.side === "buy" ? quotedUnitPrice / d.tokenPrice.price - 1 : 1 - quotedUnitPrice / d.tokenPrice.price) * 10_000;
    }
    if (!Number.isFinite(adverseBps) || Math.max(d.quote.estimatedSlippageBps, adverseBps) > p.maxSlippageBps) warn("HIGH_SLIPPAGE", "Estimated slippage or fee-inclusive quote deviation exceeds the configured limit.");
  }
  if (result.normalizedGapBps === null) warn("GAP_UNAVAILABLE", "A comparable normalized price gap cannot be established.");
  if (result.findings.some(f => f.severity === "blocking")) result.decision = "WAIT";
  else if (result.findings.some(f => f.severity === "caution")) result.decision = "MONITOR";
  else result.decision = "PROCEED_TO_REVIEW";
  return result;
}
