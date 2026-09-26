import { z } from "zod";

const id = z.string().trim().min(1);
const positive = z.number().finite().positive();
const nonnegative = z.number().finite().nonnegative();
export const currencySchema = z.string().regex(/^[A-Z]{3}$/);
export type Currency = z.infer<typeof currencySchema>;

export const providerSchema = z.object({ id, name: id });
export type Provider = z.infer<typeof providerSchema>;
export type Issuer = Provider;
export const provenanceSchema = z.object({
  mode: z.enum(["live", "synthetic"]), provider: providerSchema,
  source: id, // Feed/endpoint identifier, never credentials or response headers.
});
export type DataProvenance = z.infer<typeof provenanceSchema>;
export const providerTimestampSchema = z.object({ kind: z.literal("provider-price"), unixMs: nonnegative });
export const observationTimestampSchema = z.object({ kind: z.literal("afterclose-observation"), unixMs: nonnegative });
export type ProviderReportedPriceTimestamp = z.infer<typeof providerTimestampSchema>;
export type AfterCloseObservationTimestamp = z.infer<typeof observationTimestampSchema>;
const observation = { observedAt: observationTimestampSchema.nullable(), provenance: provenanceSchema };
const priceEvidence = { ...observation, priceAt: providerTimestampSchema.nullable(), currency: currencySchema, price: positive };

export const underlyingEquitySchema = z.object({ id, ticker: id, company: id, exchange: id, currency: currencySchema });
export type UnderlyingEquity = z.infer<typeof underlyingEquitySchema>;
export const tokenizedStockSchema = z.object({
  id, name: id, symbol: id, chainId: z.literal(56),
  contract: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  decimals: z.number().int().min(0).max(36), issuer: providerSchema,
  underlyingId: id, provenance: provenanceSchema,
});
export type TokenizedStock = z.infer<typeof tokenizedStockSchema>;
export const tokenPriceSchema = z.object({ tokenId: id, ...priceEvidence });
export type TokenPrice = z.infer<typeof tokenPriceSchema>;
export const referenceSchema = z.object({
  underlyingId: id, basis: z.enum(["independent-equity", "token-derived"]), ...priceEvidence,
});
export type ReferencePrice = z.infer<typeof referenceSchema>;
export type IndependentUnderlyingReference = ReferencePrice & { basis: "independent-equity" };
export const multiplierSchema = z.object({
  tokenId: id, underlyingId: id, sharesPerToken: positive,
  effectiveAtMs: nonnegative, validUntilMs: nonnegative, ...observation,
});
export type TokenToShareMultiplier = z.infer<typeof multiplierSchema>;
export const sessionNames = ["premarket", "regular", "postmarket", "overnight", "closed", "halted", "unknown"] as const;
export const sessionSchema = z.object({ underlyingId: id, session: z.enum(sessionNames), ...observation });
export type UnderlyingMarketSession = z.infer<typeof sessionSchema>;
export const liquiditySchema = z.object({ tokenId: id, currency: currencySchema, availableNotional: nonnegative, ...observation });
export type Liquidity = z.infer<typeof liquiditySchema>;
export const orderSchema = z.object({ tokenId: id, side: z.enum(["buy", "sell"]), quantityTokens: positive, currency: currencySchema });
export type ReviewOrder = z.infer<typeof orderSchema>;
export const quoteSchema = z.object({
  tokenId: id, chainId: z.literal(56), side: z.enum(["buy", "sell"]), quantityTokens: positive,
  currency: currencySchema, totalQuoteAmount: positive, // Total cost/proceeds, including all quoted fees.
  estimatedSlippageBps: nonnegative, executable: z.boolean(), expiresAtMs: nonnegative,
  ...observation,
});
export type ExecutableQuote = z.infer<typeof quoteSchema>;
export const truthInputSchema = z.object({
  mode: z.enum(["live", "synthetic"]), available: z.boolean(),
  observedAt: observationTimestampSchema.nullable(),
  token: tokenizedStockSchema.nullable(), underlying: underlyingEquitySchema.nullable(),
  tokenPrice: tokenPriceSchema.nullable(), references: z.array(referenceSchema),
  multiplier: multiplierSchema.nullable(), session: sessionSchema.nullable(),
  liquidity: liquiditySchema.nullable(), quote: quoteSchema.nullable(), order: orderSchema.nullable(),
});
export type TruthInput = z.infer<typeof truthInputSchema>;
