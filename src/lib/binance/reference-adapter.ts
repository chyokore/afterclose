import { z } from "zod";
import { truthInputSchema, type TruthInput } from "../reference-truth/models";
import { tokenSchema, priceSchema, marketSchema } from "./schemas";
const bundleSchema = z.object({ token: tokenSchema, quote: priceSchema, market: marketSchema, fetchedAt: z.string().datetime() });
export function toReferenceEvidence(input: unknown): TruthInput {
  const { token, quote, market, fetchedAt } = bundleSchema.parse(input);
  if (token.assetType !== 1 || [quote, market].some(v => v.platformId !== token.platformId || v.tokenContractAddress.toLowerCase() !== token.tokenContractAddress.toLowerCase())) throw new Error("Inconsistent RWA identity");
  const tokenId = `56:${token.tokenContractAddress.toLowerCase()}`;
  const underlyingId = token.underlyingTicker;
  const observedAt = { kind: "afterclose-observation" as const, unixMs: Date.parse(fetchedAt) };
  const provenance = { mode: "live" as const, provider: { id: "binance-web3", name: "Binance Web3" }, source: "RWA API; USD units per Binance documentation" };
  const decimals = token.decimals == null ? NaN : Number(token.decimals);
  const price = Number(quote.tokenPrice);
  // Raw Binance status is displayed separately; authoritative equity session evidence is absent.
  const session = "unknown";
  return truthInputSchema.parse({ mode: "live", available: true, observedAt,
    token: Number.isInteger(decimals) && decimals >= 0 && decimals <= 36 ? { id: tokenId, name: token.tokenName, symbol: token.tokenSymbol, chainId: 56, contract: token.tokenContractAddress, decimals, issuer: { id: token.platformId, name: token.platformId }, underlyingId, provenance } : null,
    underlying: null, // Exchange metadata is absent. Do not fill required identity fields by guessing.
    tokenPrice: Number.isFinite(price) && price > 0 ? { tokenId, price, currency: "USD", priceAt: quote.tokenPriceUpdatedAt == null ? null : { kind: "provider-price", unixMs: quote.tokenPriceUpdatedAt }, observedAt, provenance } : null,
    references: [], // Both provider reference prices are token-derived, not independent equity evidence.
    multiplier: null, // Ratio is reported, but its effective/expiry interval is unavailable.
    session: { underlyingId, session, observedAt, provenance }, liquidity: null, quote: null, order: null,
  });
}
