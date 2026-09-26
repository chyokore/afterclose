import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { credentialsConfigured, endpointNames, ApiError } = await import("../src/lib/binance/client");
  const api = await import("../src/lib/binance/rwa");
  if (!credentialsConfigured()) {
    console.log(JSON.stringify({ state: "setup", message: "Set BINANCE_API_KEY and BINANCE_SECRET_KEY in .env.local. No requests sent.", endpoints: endpointNames.map(endpoint => ({ endpoint, result: "skipped: missing credentials" })) }, null, 2));
    return;
  }
  // Print field names/types only; never headers, secrets, raw errors or response bodies.
  function shape(value: unknown): unknown {
    if (value === null) return "null";
    if (Array.isArray(value)) return { type: "array", count: value.length, item: value.length ? shape(value[0]) : "empty" };
    if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
    return typeof value;
  }
  async function check<T>(endpoint: string, run: () => Promise<T>): Promise<T | undefined> {
    try { const result = await run(); console.log(JSON.stringify({ endpoint, result: "passed", schema: shape(result) })); return result; }
    catch (e) { console.log(JSON.stringify({ endpoint, result: "failed", reason: e instanceof ApiError ? e.kind : "validation", status: e instanceof ApiError ? e.status : undefined })); process.exitCode = 1; }
  }
  await check("platforms", api.platforms);
  const catalog = await check("tokens", api.tokens);
  const token = catalog?.find(t => t.binanceChainId === "56" && t.assetType === 1 && ["ondo", "bstock"].includes(t.platformId));
  if (!token) {
    for (const endpoint of ["search", "price", "underlying-market"]) console.log(JSON.stringify({ endpoint, result: "skipped: no eligible API-discovered BSC stock" }));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({ discovered: { platform: token.platformId, chain: "56", contract: token.tokenContractAddress, ticker: token.underlyingTicker } }));
  await check("search", () => api.search(token.tokenContractAddress));
  await check("price", () => api.prices(token.tokenContractAddress));
  await check("underlying-market", () => api.underlyingMarket(token.tokenContractAddress));
  console.log("Underlying reference timestamp: undocumented; no freshness inference made.");
}
main().catch(() => { console.error("Diagnostic failed; raw error withheld."); process.exitCode = 1; });
