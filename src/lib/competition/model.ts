import { z } from "zod";
import { tokenSchema, priceSchema, marketSchema, searchSchema, platformSchema, mvpContract } from "../binance/schemas";
export const endpointOrder = ["platforms", "tokens", "search", "price", "underlying-market", "chain-list"] as const;
const time = z.number().int().nonnegative().max(8.64e15);
export const auditSchema = z.object({ endpoint: z.enum(endpointOrder), status: z.number().int().optional(), latencyMs: z.number().nonnegative(), code: z.string().regex(/^\d{1,10}$/).optional(), responseTimestamp: time.optional(), observedAtMs: time.optional(), networkCode: z.enum(["TIMEOUT", "ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "SELF_SIGNED_CERT_IN_CHAIN", "CERT_HAS_EXPIRED", "UNCLASSIFIED"]).optional() });
export const chainSchema = z.array(z.object({ binanceChainId: z.string(), name: z.string(), shortName: z.string().optional() }));
export const issuerCaptureSchema = z.object({
  availability: z.enum(["reported", "unavailable"]), value: z.string().regex(/^\d+(\.\d+)?$/).nullable(), observedAtMs: time.nullable(),
  source: z.literal("https://app.ondo.finance/assets/nvdaon"),
  effectiveAtMs: z.null(), validUntilMs: z.null(), verification: z.literal("unverified"),
});
export const liveObservationSchema = z.object({
  mode: z.literal("live"), state: z.enum(["connected", "unavailable"]),
  failure: z.enum(["setup", "configuration", "network", "http", "schema", "provider", "discovery"]).nullable(),
  token: tokenSchema.nullable(), quote: priceSchema.nullable(), market: marketSchema.nullable(),
  discovery: z.enum(["MATCH", "CHANGED", "UNVERIFIED"]), searchCompany: z.string().max(200).nullable(),
  audits: z.array(auditSchema).max(6), chains: chainSchema.nullable(), issuer: issuerCaptureSchema,
});
export type LiveObservation = z.infer<typeof liveObservationSchema>;
export function discoverNvda(catalog: z.infer<typeof tokenSchema>[], issuers: z.infer<typeof platformSchema>, matches: z.infer<typeof searchSchema>) {
  // Search symbol/company first. Historical address is a comparison, never a selector.
  const candidates = catalog.filter(t => t.binanceChainId === "56" && t.platformId === "ondo" && t.assetType === 1 && t.tokenSymbol === "NVDAon" && t.underlyingTicker === "NVDA");
  const token = candidates.length === 1 ? candidates[0] : null;
  const matching = token ? matches.filter(m => m.ticker === "NVDA" && /nvidia/i.test(m.companyName ?? "") && m.assets.some(a => a.binanceChainId === "56" && a.platformId === "ondo" && a.assetType === 1 && a.tokenSymbol === "NVDAon" && a.tokenContractAddress.toLowerCase() === token.tokenContractAddress.toLowerCase())) : [];
  const valid = token && /nvidia/i.test(token.underlyingName ?? token.tokenName) && token.decimals != null && Number.isInteger(Number(token.decimals)) && Number(token.decimals) >= 0 && Number(token.decimals) <= 36 && matching.length === 1 && issuers.some(p => p.platformId === "ondo" && p.chainDistribution.some(c => c.binanceChainId === "56" && c.tokenCount > 0));
  return { token, searchCompany: matching[0]?.companyName ?? null, discovery: !valid ? "UNVERIFIED" as const : token.tokenContractAddress.toLowerCase() === mvpContract ? "MATCH" as const : "CHANGED" as const };
}
