import "server-only";
import { z } from "zod";
import { ApiError, credentialsConfigured, rwaGet, type ResponseAudit } from "./client";

type AuditObserver = (audit: ResponseAudit) => void;
const address = z.string().regex(/^0x[0-9a-fA-F]{40}$/);
const identity = z.object({ binanceChainId: z.string(), tokenContractAddress: address, platformId: z.string() });
const status = z.object({ marketStatus: z.string(), openState: z.boolean() });
const decimal = z.string().regex(/^\d+(\.\d+)?$/);
export const tokenSchema = identity.extend({ tokenSymbol: z.string(), tokenName: z.string(), underlyingTicker: z.string(), assetType: z.number() });
const priceSchema = identity.extend({ tokenPrice: decimal.nullish(), referencePrice: decimal.nullish(), tokenPriceUpdatedAt: z.number().nullish() });
const marketSchema = identity.extend({ statusInfo: status.nullish(), marketData: z.object({ referencePrice: decimal.nullish() }).nullish() });
export const platforms = (observe?: AuditObserver) => rwaGet("platforms", {}, z.array(z.object({ platformId: z.string(), chainDistribution: z.array(z.object({ binanceChainId: z.string(), tokenCount: z.number() })) })), observe);
export const tokens = (observe?: AuditObserver) => rwaGet("tokens", { binanceChainId: "56" }, z.array(tokenSchema), observe);
export const search = (keyword: string, observe?: AuditObserver) => rwaGet("search", { keyword }, z.array(z.object({ ticker: z.string(), assets: z.array(identity.extend({ assetType: z.number(), tokenSymbol: z.string() })) })), observe);
export const prices = (contract: string, observe?: AuditObserver) => rwaGet("price", { binanceChainId: "56", tokenContractAddresses: address.parse(contract) }, z.array(priceSchema), observe);
export const underlyingMarket = (contract: string, observe?: AuditObserver) => rwaGet("underlying-market", { binanceChainId: "56", tokenContractAddress: address.parse(contract) }, marketSchema, observe);

export async function loadRwa() {
  if (!credentialsConfigured()) return { state: "setup" as const };
  try {
    const [issuers, catalog] = await Promise.all([platforms(), tokens()]);
    const token = catalog.find(t => t.binanceChainId === "56" && t.assetType === 1 && ["ondo", "bstock"].includes(t.platformId) && issuers.some(p => p.platformId === t.platformId && p.chainDistribution.some(c => c.binanceChainId === "56" && c.tokenCount > 0)));
    if (!token) return { state: "empty" as const };
    const matches = await search(token.tokenContractAddress);
    if (!matches.some(m => m.assets.some(a => a.binanceChainId === "56" && a.platformId === token.platformId && a.tokenContractAddress.toLowerCase() === token.tokenContractAddress.toLowerCase()))) throw new ApiError("schema");
    const [quotes, market] = await Promise.all([prices(token.tokenContractAddress), underlyingMarket(token.tokenContractAddress)]);
    const same = (item: z.infer<typeof identity>) => item.binanceChainId === "56" && item.platformId === token.platformId && item.tokenContractAddress.toLowerCase() === token.tokenContractAddress.toLowerCase();
    const quote = quotes.find(same);
    if (!quote || !same(market)) throw new ApiError("schema");
    return { state: "connected" as const, token, quote, market, fetchedAt: new Date().toISOString() };
  } catch (error) {
    return { state: "error" as const, reason: error instanceof ApiError ? error.kind : "schema" };
  }
}
