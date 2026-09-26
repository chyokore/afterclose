import { z } from "zod";

export const ONDO_ASSET_SOURCE = "https://app.ondo.finance/assets/nvdaon";
export const NVDAON_CONTRACT = "0xa9ee28c80f960b889dfbd1902055218cba016f75";
// Decimal strings are never converted to Number. BigInt is used only for exact positivity validation.
const decimal = z.string().max(100).regex(/^(0|[1-9]\d*)(\.\d+)?$/).refine(v => v.length <= 100 && /^(0|[1-9]\d*)(\.\d+)?$/.test(v) && BigInt(v.replace(".", "")) > BigInt(0));
export const multiplierEvidenceSchema = z.object({
  assetId: z.literal("NVDAon"), ticker: z.literal("NVDA"), company: z.string().min(1),
  contract: z.literal(NVDAON_CONTRACT), chainId: z.literal(56),
  value: decimal, units: z.literal("shares-per-token"),
  effectiveAtMs: z.number().int().nonnegative().nullable(), validUntilMs: z.number().int().nonnegative().nullable(),
  observedAtMs: z.number().int().nonnegative(), source: z.literal(ONDO_ASSET_SOURCE),
  mode: z.enum(["live", "synthetic"]), verification: z.enum(["unverified", "verified"]),
});
export type MultiplierEvidence = z.infer<typeof multiplierEvidenceSchema>;
export type IssuerObservation = {
  availability: "reported" | "unavailable"; evidence: MultiplierEvidence | null;
  observedAtMs: number; reason: string;
};
const pageRecord = z.object({
  sharesMultiplier: decimal, symbol: z.literal("NVDAon"), underlyingName: z.string().min(1), ticker: z.literal("NVDA"),
  supportedNetworks: z.array(z.object({ network: z.string(), chainId: z.number().int(), address: z.string(), decimals: z.number().int() })),
});
export function unavailableIssuer(observedAtMs: number, reason = "Official issuer page unavailable; authenticated metadata API access remains unresolved."): IssuerObservation {
  return { availability: "unavailable", evidence: null, observedAtMs, reason };
}
// The public page is not a stable API. Accept only the observed named metadata structure; fail closed on change.
export function parseOndoPage(html: string, observedAtMs: number): IssuerObservation {
  const unavailable = () => unavailableIssuer(observedAtMs, "Official page metadata missing, changed or inconsistent; current multiplier remains unverified.");
  if (html.length > 2_000_000 || !Number.isSafeInteger(observedAtMs) || observedAtMs < 0) return unavailable();
  try {
    const chunks: string[] = [];
    for (const m of html.matchAll(/self\.__next_f\.push\((\[[\s\S]*?\])\)<\/script>/g)) {
      const part: unknown = JSON.parse(m[1]);
      if (Array.isArray(part) && part[0] === 1 && typeof part[1] === "string") chunks.push(part[1]);
    }
    const matches = [...chunks.join("").matchAll(/"sharesMultiplier":"[^"\n]+","symbol":"NVDAon","underlyingName":"[^"\n]+","ticker":"NVDA","supportedNetworks":\[[^\]]+\]/g)];
    if (matches.length !== 1) return unavailable();
    const parsed = pageRecord.safeParse(JSON.parse(`{${matches[0][0]}}`));
    if (!parsed.success) return unavailable();
    const p = parsed.data;
    const bsc = p.supportedNetworks.filter(n => n.chainId === 56);
    if (bsc.length !== 1 || bsc[0].network !== "BSC" || bsc[0].address.toLowerCase() !== NVDAON_CONTRACT || bsc[0].decimals !== 18) return unavailable();
    const evidence: MultiplierEvidence = {
      assetId: "NVDAon", ticker: "NVDA", company: p.underlyingName, contract: NVDAON_CONTRACT, chainId: 56,
      value: p.sharesMultiplier, units: "shares-per-token", effectiveAtMs: null, validUntilMs: null,
      observedAtMs, source: ONDO_ASSET_SOURCE, mode: "live", verification: "unverified",
    };
    return { availability: "reported", evidence, observedAtMs,
      reason: "Issuer reports shares per token and corroborates the contract, but supplies no effective timestamp or validity interval here. BSC price display basis also needs reconciliation." };
  } catch { return unavailable(); }
}

// Admission guard only; no floating-point engine mapping is implemented.
export function multiplierBlocker(raw: unknown, atMs: number, mode: "live" | "synthetic"): string | null {
  const p = multiplierEvidenceSchema.safeParse(raw);
  if (!p.success) return "Missing or invalid multiplier identity, decimal value or shares-per-token units.";
  const m = p.data;
  if (m.mode !== mode || m.verification !== "verified") return "Historical, unverified or mixed-mode multiplier evidence.";
  if (!Number.isSafeInteger(atMs) || atMs < m.observedAtMs || m.effectiveAtMs === null || m.validUntilMs === null || m.effectiveAtMs > m.observedAtMs || m.effectiveAtMs > atMs || m.validUntilMs <= atMs || m.validUntilMs <= m.effectiveAtMs) return "Multiplier applicability at this time is not established.";
  return null;
}
