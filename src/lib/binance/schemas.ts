import { z } from "zod";
const text = z.string().min(1);
export const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
export const identity = z.object({ binanceChainId: z.literal("56"), tokenContractAddress: address, platformId: text });
const decimal = z.string().regex(/^\d+(\.\d+)?$/);
const assetType = z.union([z.literal(1), z.literal(2), z.literal(3)]).nullable();
const status = z.object({ marketStatus: text.nullable(), openState: z.boolean() });
export const tokenSchema = identity.extend({ tokenSymbol: text, tokenName: text, underlyingTicker: text, assetType,
  underlyingName: text.nullish(), decimals: z.union([z.string().regex(/^\d+$/), z.number().int().min(0).max(36)]).nullish(),
  tokenToShareRatio: decimal.nullish(), statusInfo: status.nullish(), tokenPrice: decimal.nullish(), referencePrice: decimal.nullish(),
});
const searchIdentity = z.union([
  z.object({ binanceChainId: z.enum(["1", "56"]), tokenContractAddress: address, platformId: text }),
  z.object({ binanceChainId: z.literal("CT_501"), tokenContractAddress: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/), platformId: text }),
]);
export const searchSchema = z.array(z.object({ ticker: text, companyName: text.nullish(), assets: z.array(searchIdentity.and(z.object({ tokenSymbol: text, assetType }))) }));
export const priceSchema = identity.extend({ tokenPrice: decimal.nullish(), referencePrice: decimal.nullish(), tokenPriceUpdatedAt: z.number().int().nonnegative().nullish() });
export const marketSchema = identity.extend({ statusInfo: status.nullish(), marketData: z.object({ referencePrice: decimal.nullish() }).nullish() });
export const platformSchema = z.array(z.object({ platformId: text, chainDistribution: z.array(z.object({ binanceChainId: text, tokenCount: z.number().int().nonnegative() })) }));
// API discovery on 2026-09-26; BscScan indexed metadata corroborates this address.
// Fresh direct explorer access returned 403, so this is not a fresh independent verification.
export const mvpContract = "0xa9ee28c80f960b889dfbd1902055218cba016f75";
export function selectMvp(catalog: z.infer<typeof tokenSchema>[]) {
  return catalog.find(t => t.binanceChainId === "56" && t.assetType === 1 && t.platformId === "ondo" && t.underlyingTicker === "NVDA" && t.tokenSymbol === "NVDAon" && t.tokenContractAddress.toLowerCase() === mvpContract);
}
