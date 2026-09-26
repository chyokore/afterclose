import "server-only";
import { z } from "zod";
import { ApiError, credentialsConfigured, rwaGet, type ResponseAudit } from "./client";
import type { FailureCode } from "../evidence/status";

type AuditObserver = (audit: ResponseAudit) => void;
export { tokenSchema, selectMvp } from "./schemas";
import { address, identity, tokenSchema, priceSchema, marketSchema, platformSchema, searchSchema, selectMvp } from "./schemas";
export const platforms = (observe?: AuditObserver) => rwaGet("platforms", {}, platformSchema, observe);
export const tokens = (observe?: AuditObserver) => rwaGet("tokens", { binanceChainId: "56" }, z.array(tokenSchema), observe);
export const search = (keyword: string, observe?: AuditObserver) => rwaGet("search", { keyword }, searchSchema, observe);
export const prices = (contract: string, observe?: AuditObserver) => rwaGet("price", { binanceChainId: "56", tokenContractAddresses: address.parse(contract) }, z.array(priceSchema), observe);
export const underlyingMarket = (contract: string, observe?: AuditObserver) => rwaGet("underlying-market", { binanceChainId: "56", tokenContractAddress: address.parse(contract) }, marketSchema, observe);

export async function loadRwa() {
  if (!credentialsConfigured()) return { state: "setup" as const };
  try {
    const [issuers, catalog] = await Promise.all([platforms(), tokens()]);
    const token = selectMvp(catalog);
    if (!token || !issuers.some(p => p.platformId === token.platformId && p.chainDistribution.some(c => c.binanceChainId === "56" && c.tokenCount > 0))) return { state: "empty" as const };
    const matches = await search(token.tokenContractAddress);
    if (!matches.some(m => m.ticker === token.underlyingTicker && m.assets.some(a => a.tokenSymbol === token.tokenSymbol && a.assetType === 1 && a.binanceChainId === "56" && a.platformId === token.platformId && a.tokenContractAddress.toLowerCase() === token.tokenContractAddress.toLowerCase()))) throw new ApiError("schema");
    const [quotes, market] = await Promise.all([prices(token.tokenContractAddress), underlyingMarket(token.tokenContractAddress)]);
    const same = (item: z.infer<typeof identity>) => item.binanceChainId === "56" && item.platformId === token.platformId && item.tokenContractAddress.toLowerCase() === token.tokenContractAddress.toLowerCase();
    const quote = quotes.find(same);
    if (!quote || !same(market)) throw new ApiError("schema");
    return { state: "connected" as const, token, quote, market, fetchedAt: new Date().toISOString() };
  } catch (error) {
    const reason = error instanceof ApiError ? error.kind : "schema";
    let failure: FailureCode = reason;
    if (error instanceof ApiError) {
      if (error.audit?.networkCode === "TIMEOUT" || error.audit?.networkCode?.includes("TIMEOUT") || error.audit?.networkCode === "ETIMEDOUT") failure = "timeout";
      else if (error.status === 401 || error.status === 403 || ["40101", "40102", "40103", "40104"].includes(error.audit?.code ?? "")) failure = "authentication";
      else if (error.status === 429) failure = "rate-limit";
    }
    return { state: "error" as const, reason, failure };
  }
}
