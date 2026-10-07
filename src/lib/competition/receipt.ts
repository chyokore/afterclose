import "server-only";
import { createHash } from "node:crypto";
import { measure } from "../metrics";
import { liveObservationSchema } from "./model";
import { mvpContract } from "../binance/schemas";
import { classifyFreshness, freshnessPolicy } from "./freshness";
import { defaultPolicy, evaluateReferenceTruth } from "../reference-truth/engine";
import { truthInputSchema } from "../reference-truth/models";
import { unavailableTruth } from "../equity/provider";
import { nasdaqSchedule, observeNasdaqSchedule, scheduleSchema } from "../session/nasdaq-calendar";

export const ENGINE_ID = "reference-truth/v1:0b8daa72d38484ed6c6e4ea5e89213029c3c47f97bfcccdca6a7aa67e6cc669b";
// Actual manual re-review of official Nasdaq holiday and hours pages. Never Date.now().
export const competitionSchedule = { ...nasdaqSchedule, observedAtMs: Date.parse("2026-10-06T12:34:48Z") };
export function canonicalize(value: unknown): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  if (typeof value === "object" && value && Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`).join(",")}}`;
  }
  throw new Error("Receipt must contain finite JSON values only");
}
export const digestOf = (value: unknown) => {
  const json=measure("canonicalJsonMs",()=>canonicalize(value));
  return measure("sha256Ms",()=>createHash("sha256").update(json).digest("hex"));
};
const cleanJson = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
export function createEvidenceReceipt(raw: unknown, evaluatedAtMs: number, rawSchedule: unknown = competitionSchedule) {
  const observation = cleanJson(liveObservationSchema.parse(raw));
  const calendarReview = scheduleSchema.parse(rawSchedule);
  if (calendarReview.mode !== "live" || !Number.isSafeInteger(evaluatedAtMs) || evaluatedAtMs < 0 || evaluatedAtMs > 8.64e15) throw new Error("Invalid live evaluation context");
  const audit = (endpoint: string) => observation.audits.find(a => a.endpoint === endpoint);
  if (new Set(observation.audits.map(a => a.endpoint)).size !== observation.audits.length) throw new Error("Duplicate endpoint observations");
  const token = observation.token;
  const priceAt = observation.quote?.tokenPriceUpdatedAt ?? null;
  const priceObserved = audit("price")?.observedAtMs ?? null;
  const numericPrice = observation.quote?.tokenPrice == null ? null : Number(observation.quote.tokenPrice);
  const positivePrice = numericPrice !== null && Number.isFinite(numericPrice) && numericPrice > 0;
  const freshness = classifyFreshness(positivePrice, priceAt, priceObserved, evaluatedAtMs);
  const matchingEvidence = token && token.platformId === "ondo" && token.assetType === 1 && token.tokenSymbol === "NVDAon" && token.underlyingTicker === "NVDA" && token.tokenContractAddress.toLowerCase() === mvpContract && /nvidia/i.test(observation.searchCompany ?? "") && token.decimals != null && Number.isInteger(Number(token.decimals)) && Number(token.decimals) >= 0 && Number(token.decimals) <= 36 && observation.quote && observation.market && [observation.quote, observation.market].every(v => v.binanceChainId === token.binanceChainId && v.platformId === token.platformId && v.tokenContractAddress.toLowerCase() === token.tokenContractAddress.toLowerCase());
  const transportVerified = observation.state === "connected" && observation.discovery === "MATCH" && !!matchingEvidence && observation.audits.length === 6 && observation.audits.every(a => a.status === 200 && a.code === "0" && a.observedAtMs !== undefined && a.observedAtMs <= evaluatedAtMs) && !!observation.chains?.some(c => c.binanceChainId === "56");
  const engineInput = unavailableTruth(evaluatedAtMs);
  if (transportVerified && token) {
    engineInput.available = true;
    const tokenId = `56:${token.tokenContractAddress.toLowerCase()}`;
    const provenance = (endpoint: string) => ({ mode: "live" as const, provider: { id: "binance-web3", name: "Binance Web3" }, source: `/api/v1/dex/market/rwa/${endpoint}` });
    const decimals = token.decimals == null ? NaN : Number(token.decimals);
    if (Number.isInteger(decimals) && decimals >= 0 && decimals <= 36) engineInput.token = { id: tokenId, name: token.tokenName, symbol: token.tokenSymbol, chainId: 56, contract: token.tokenContractAddress, decimals, issuer: { id: "ondo", name: "Ondo Finance" }, underlyingId: token.underlyingTicker, provenance: provenance("tokens") };
    if (positivePrice) engineInput.tokenPrice = { tokenId, price: numericPrice!, currency: "USD", priceAt: priceAt === null ? null : { kind: "provider-price", unixMs: priceAt }, observedAt: priceObserved === null ? null : { kind: "afterclose-observation", unixMs: priceObserved }, provenance: provenance("price") };
    // Missing exchange identity, independent quote, dated multiplier and authoritative session remain null.
  }
  const parsedInput = truthInputSchema.parse(engineInput);
  const result = measure("engineMs",()=>evaluateReferenceTruth(parsedInput, evaluatedAtMs));
  const calendar = observeNasdaqSchedule(evaluatedAtMs, calendarReview);
  const calendarEvent = calendar.availability !== "available" ? "UNKNOWN" : calendarReview.holidays.includes(calendar.calendarDate!) ? "HOLIDAY" : calendarReview.earlyCloses.includes(calendar.calendarDate!) ? "EARLY_CLOSE" : "STANDARD";
  type Field = { id: string; label: string; raw: string | number | boolean | null; normalized: string | number | null; provider: string; source: string; asset: string | null; chain: number; contract: string | null; providerAtMs: number | null; providerTimeSemantics: string; observedAtMs: number | null; observationAgeMs: number | null; providerDataAgeMs: number | null; latencyMs: number | null; classification: string; derived: boolean; usedByEngine: boolean; limitation: string };
  const fields: Field[] = [];
  function field(id: string, label: string, value: Field["raw"], endpoint: string, providerAtMs: number | null, semantics: string, usedByEngine: boolean, limitation: string, normalized: Field["normalized"] = null) {
    const a = audit(endpoint), observedAtMs = a?.observedAtMs ?? null;
    fields.push({ id, label, raw: value, normalized, provider: "Binance Web3 RWA", source: `/api/v1/dex/market/rwa/${endpoint}`, asset: token?.tokenSymbol ?? null, chain: 56, contract: token?.tokenContractAddress ?? null, providerAtMs, providerTimeSemantics: semantics, observedAtMs, observationAgeMs: observedAtMs !== null && observedAtMs <= evaluatedAtMs ? evaluatedAtMs - observedAtMs : null, providerDataAgeMs: providerAtMs !== null && providerAtMs <= evaluatedAtMs ? evaluatedAtMs - providerAtMs : null, latencyMs: a?.latencyMs ?? null, classification: id === "token-price" ? freshness.status : value === null ? "UNAVAILABLE" : providerAtMs === null ? "UNDATED_PROVIDER_REPORT" : "PROVIDER_REPORT", derived: false, usedByEngine, limitation });
  }
  field("token-price", "Token price (USD per token)", observation.quote?.tokenPrice ?? null, "price", priceAt, "tokenPriceUpdatedAt: provider token-price update, Unix milliseconds", !!parsedInput.tokenPrice, "USD units from Binance documentation; normalized Number is engine parsing, not per-share normalization.", positivePrice ? numericPrice : null);
  field("identity", "Token contract", token?.tokenContractAddress ?? null, "tokens", null, "No identity effective timestamp", !!parsedInput.token, `Discovery comparison: ${observation.discovery}. Provider-reported identity, not on-chain attestation.`);
  field("decimals", "Token decimals", token?.decimals ?? null, "tokens", null, "No metadata effective timestamp", !!parsedInput.token, "Reported token unit scale.", token?.decimals == null ? null : Number(token.decimals));
  field("price-reference", "Token-derived price reference (USD/share)", observation.quote?.referencePrice ?? null, "price", null, "No separate reference event time supplied", false, "Derived by Binance from token infrastructure; never an independent equity quote. Token timestamp is not reassigned to this field.");
  field("market-reference", "Token-derived underlying-market reference (USD/share)", observation.market?.marketData?.referencePrice ?? null, "underlying-market", null, "Reference event time absent", false, "Not an independent NVDA market price.");
  field("ratio", "Binance reported shares/token", token?.tokenToShareRatio ?? null, "tokens", null, "Effective date and validity interval absent", false, "Not admitted as a verified current multiplier.");
  field("market-status", "Binance raw market status", observation.market?.statusInfo?.marketStatus ?? null, "underlying-market", null, "Status event time absent", false, "Provider RWA status is not an authoritative exchange/security status feed.");
  const issuer = observation.issuer;
  fields.push({ id: "issuer-multiplier", label: "Ondo reported shares/token", raw: issuer.value, normalized: null, provider: "Ondo Finance", source: issuer.source, asset: "NVDAon", chain: 56, contract: token?.tokenContractAddress ?? null, providerAtMs: null, providerTimeSemantics: "Effective date unavailable", observedAtMs: issuer.observedAtMs, observationAgeMs: issuer.observedAtMs !== null && evaluatedAtMs >= issuer.observedAtMs ? evaluatedAtMs - issuer.observedAtMs : null, providerDataAgeMs: null, latencyMs: null, classification: issuer.value === null ? "UNAVAILABLE" : "UNDATED_PROVIDER_REPORT", derived: false, usedByEngine: false, limitation: "No effective date or validity interval; current applicability remains unverified." });
  const core = {
    schemaVersion: "afterclose-evidence-receipt/v1", mode: "live" as const, evaluatedAtMs,
    asset: token ? { symbol: token.tokenSymbol, name: token.tokenName, underlying: token.underlyingTicker, company: observation.searchCompany, chain: 56, contract: token.tokenContractAddress, decimals: token.decimals ?? null, issuer: token.platformId } : null,
    observation, fields, transportVerified, freshness, freshnessPolicy,
    evidenceStatus: observation.state !== "connected" ? "UNAVAILABLE" : freshness.status === "LIVE" ? "PARTIAL" : freshness.status,
    discovery: observation.discovery,
    multiplier: { status: "UNVERIFIED", reportedValue: issuer.value, effectiveAtMs: null, validUntilMs: null, currentApplicability: "UNVERIFIED", normalizedTokenPrice: null },
    independentReference: { status: "UNAVAILABLE", reason: "No independent NVDA provider with confirmed timestamps and public-display entitlement is connected." },
    calendarReview, session: { scheduled: calendar, calendarEvent, authoritative: "UNKNOWN" },
    execution: { quote: "UNAVAILABLE", route: null, simulation: "NOT_RUN", liquidity: null, priceImpact: null, slippage: null, reason: "RWA RFQ needs owner-supplied wallet context; no wallet or genuine transaction context provided. No transaction endpoint called." },
    engine: { id: ENGINE_ID, input: parsedInput, policy: defaultPolicy, result, blockerCodes: result.findings.filter(f => f.severity === "blocking").map(f => f.code) },
  };
  const receipt = cleanJson({ ...core, evaluationId: `ac-${digestOf(core)}` });
  return { receipt, canonicalJson: canonicalize(receipt), digest: digestOf(receipt) };
}
export type EvidenceReceipt = ReturnType<typeof createEvidenceReceipt>;
export function verifyReceipt(value: unknown): EvidenceReceipt | null {
  try {
    if (!value || typeof value !== "object") return null;
    const envelope = value as EvidenceReceipt;
    const r = envelope.receipt;
    const rebuilt = createEvidenceReceipt(r.observation, r.evaluatedAtMs, r.calendarReview);
    return rebuilt.digest === envelope.digest && rebuilt.canonicalJson === envelope.canonicalJson && canonicalize(r) === rebuilt.canonicalJson ? rebuilt : null;
  } catch { return null; }
}
export function eligibleSnapshot(envelope: EvidenceReceipt) {
  return envelope.receipt.transportVerified && envelope.receipt.freshness.status !== "UNAVAILABLE" && envelope.receipt.engine.input.tokenPrice !== null;
}
export function snapshotView(envelope: EvidenceReceipt, nowMs: number) {
  return { label: "Last verified snapshot", status: "HISTORICAL" as const, capturedAtMs: envelope.receipt.evaluatedAtMs,
    ageMs: nowMs >= envelope.receipt.evaluatedAtMs ? nowMs - envelope.receipt.evaluatedAtMs : null,
    providerDataAgeMs: envelope.receipt.engine.input.tokenPrice?.priceAt ? Math.max(0, nowMs - envelope.receipt.engine.input.tokenPrice.priceAt.unixMs) : null,
    digest: envelope.digest, envelope };
}
