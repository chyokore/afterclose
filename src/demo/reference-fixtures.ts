import type { TruthInput } from "../lib/reference-truth/models";

// DEMO — SYNTHETIC DATA. Fictional issuers, prices, addresses and providers.
// Never import this module into a production market-data adapter.
export const DEMO_NOW = Date.parse("2026-09-26T12:00:00.000Z");
const observedAt = { kind: "afterclose-observation" as const, unixMs: DEMO_NOW - 1_000 };
const priceAt = { kind: "provider-price" as const, unixMs: DEMO_NOW - 5_000 };
const provenance = (id: string) => ({ mode: "synthetic" as const, provider: { id, name: `Fictional ${id}` }, source: `synthetic-fixture:${id}` });

function fresh(): TruthInput {
  return {
    mode: "synthetic", available: true, observedAt,
    token: { id: "demo-token", name: "Fictional Example Stock Token", symbol: "DEMO", chainId: 56, contract: "0x0000000000000000000000000000000000000001", decimals: 18, issuer: { id: "demo-issuer", name: "Fictional Issuer" }, underlyingId: "demo-equity", provenance: provenance("demo-issuer") },
    underlying: { id: "demo-equity", ticker: "EXAMPLE", company: "Fictional Example Company", exchange: "DEMO EXCHANGE", currency: "USD" },
    tokenPrice: { tokenId: "demo-token", price: 204, currency: "USD", priceAt, observedAt, provenance: provenance("token-feed") },
    references: ["equity-feed-a", "equity-feed-b"].map(id => ({ underlyingId: "demo-equity", basis: "independent-equity", price: 100, currency: "USD", priceAt, observedAt, provenance: provenance(id) })),
    multiplier: { tokenId: "demo-token", underlyingId: "demo-equity", sharesPerToken: 2, effectiveAtMs: DEMO_NOW - 60_000, validUntilMs: DEMO_NOW + 60_000, observedAt, provenance: provenance("demo-issuer") },
    session: { underlyingId: "demo-equity", session: "regular", observedAt, provenance: provenance("session-feed") },
    liquidity: { tokenId: "demo-token", currency: "USD", availableNotional: 50_000, observedAt, provenance: provenance("liquidity-feed") },
    order: { tokenId: "demo-token", side: "buy", quantityTokens: 10, currency: "USD" },
    quote: { tokenId: "demo-token", chainId: 56, side: "buy", quantityTokens: 10, currency: "USD", totalQuoteAmount: 2042, estimatedSlippageBps: 10, executable: true, expiresAtMs: DEMO_NOW + 15_000, observedAt, provenance: provenance("quote-feed") },
  };
}
export const scenarioNames = {
  "missing-independent": "Fresh token, no independent equity quote",
  "stale-token": "Fresh equity quotes, stale token",
  "closed-stale-reference": "Market closed with stale equity quotes",
  "missing-multiplier": "Multiplier validity unverified",
  "stale-reference": "Fresh token, stale underlying reference",
  "fresh-evidence": "Fresh token and independent references",
  "missing-timestamp": "Missing underlying timestamp",
  "provider-disagreement": "Reference providers disagree",
  "insufficient-liquidity": "Insufficient liquidity",
  "high-slippage": "High estimated slippage",
  "market-closed": "Underlying market closed",
  "api-unavailable": "API unavailable",
} as const;
export type Scenario = keyof typeof scenarioNames;

/** New deep copy per call prevents cross-test or cross-scenario mutation. */
export function syntheticFixture(scenario: Scenario): TruthInput {
  const input = structuredClone(fresh());
  for (const item of [input.tokenPrice, ...input.references, input.multiplier, input.session, input.liquidity, input.quote]) {
    if (item?.observedAt) item.observedAt = { ...item.observedAt };
    if (item && "priceAt" in item && item.priceAt) item.priceAt = { ...item.priceAt };
  }
  switch (scenario) {
    case "missing-independent": input.references = []; break;
    case "stale-token": input.tokenPrice!.priceAt!.unixMs = DEMO_NOW - 3_600_000; break;
    case "closed-stale-reference": input.session!.session = "closed"; input.references.forEach(r => { r.priceAt!.unixMs = DEMO_NOW - 3_600_000; }); break;
    case "missing-multiplier": input.multiplier = null; break;
    case "stale-reference": input.references.forEach(r => { r.priceAt!.unixMs = DEMO_NOW - 3_600_000; }); break;
    case "missing-timestamp": input.references[0].priceAt = null; break;
    case "provider-disagreement": input.references[1].price = 110; break;
    case "insufficient-liquidity": input.liquidity!.availableNotional = 500; break;
    case "high-slippage": input.quote!.estimatedSlippageBps = 200; break;
    case "market-closed": input.session!.session = "closed"; break;
    case "api-unavailable": input.available = false; input.tokenPrice = null; input.references = []; input.liquidity = null; input.quote = null; break;
  }
  return input;
}
