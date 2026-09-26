import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_NOW, syntheticFixture, type Scenario } from "../src/demo/reference-fixtures";
import { defaultPolicy, evaluateReferenceTruth, type Decision, type TruthPolicy } from "../src/lib/reference-truth/engine";
import type { TruthInput } from "../src/lib/reference-truth/models";

const cases: [Scenario, Decision, string | null][] = [
  ["stale-reference", "WAIT", "STALE_EVIDENCE"],
  ["fresh-evidence", "PROCEED_TO_REVIEW", null],
  ["missing-timestamp", "WAIT", "MISSING_TIMESTAMP"],
  ["provider-disagreement", "WAIT", "PROVIDER_DISAGREEMENT"],
  ["insufficient-liquidity", "WAIT", "INSUFFICIENT_LIQUIDITY"],
  ["high-slippage", "WAIT", "HIGH_SLIPPAGE"],
  ["market-closed", "MONITOR", "SESSION_NOT_REVIEWABLE"],
  ["api-unavailable", "WAIT", "API_UNAVAILABLE"],
];
for (const [scenario, decision, code] of cases) test(`SYNTHETIC: ${scenario}`, () => {
  const result = evaluateReferenceTruth(syntheticFixture(scenario), DEMO_NOW);
  assert.equal(result.decision, decision);
  assert.equal(result.mode, "synthetic");
  assert.equal(result.execution, "DISABLED");
  if (code) assert.ok(result.findings.some(f => f.code === code));
  if (scenario === "stale-reference") assert.equal(result.tokenPriceAgeMs, 5000);
});
test("share multiplier normalizes per-token price into per-share price", () => {
  const result = evaluateReferenceTruth(syntheticFixture("fresh-evidence"), DEMO_NOW);
  assert.equal(result.normalizedTokenPrice, 102);
  assert.equal(result.referenceConsensusPrice, 100);
  assert.ok(Math.abs(result.normalizedGapBps! - 200) < 1e-8);
  assert.equal(result.tokenPriceAgeMs, 5000);
  assert.deepEqual(result.referenceAgesMs, [5000, 5000]);
  assert.equal(result.observationAgeMs, 1000);
});
test("fresh observation never refreshes an old or missing underlying timestamp", () => {
  for (const scenario of ["stale-reference", "missing-timestamp"] as const) {
    const input = syntheticFixture(scenario);
    input.observedAt!.unixMs = DEMO_NOW;
    input.references.forEach(r => { r.observedAt!.unixMs = DEMO_NOW; });
    const result = evaluateReferenceTruth(input, DEMO_NOW);
    assert.equal(result.observationAgeMs, 0);
    assert.equal(result.decision, "WAIT");
    assert.equal(result.referenceAgesMs[0], scenario === "stale-reference" ? 3_600_000 : null);
  }
});
for (const field of ["token", "underlying", "tokenPrice", "multiplier", "session", "liquidity", "quote", "order", "observedAt"] as const) {
  test(`missing ${field} fails closed`, () => {
    const input = syntheticFixture("fresh-evidence");
    input[field] = null;
    assert.equal(evaluateReferenceTruth(input, DEMO_NOW).decision, "WAIT");
  });
}
const mutations: [string, (d: TruthInput) => void][] = [
  ["no references", d => { d.references = []; }],
  ["one reference provider", d => { d.references.pop(); }],
  ["duplicate reference provider", d => { d.references[1].provenance.provider.id = d.references[0].provenance.provider.id; }],
  ["issuer is reference provider", d => { d.references[0].provenance.provider.id = d.token!.issuer.id; }],
  ["token-derived reference", d => { d.references[0].basis = "token-derived"; }],
  ["mixed demo/live provenance", d => { d.references[0].provenance.mode = "live"; }],
  ["currency mismatch", d => { d.references[0].currency = "EUR"; }],
  ["token identity mismatch", d => { d.quote!.tokenId = "other"; }],
  ["equity identity mismatch", d => { d.references[0].underlyingId = "other"; }],
  ["zero multiplier", d => { d.multiplier!.sharesPerToken = 0; }],
  ["expired multiplier", d => { d.multiplier!.validUntilMs = DEMO_NOW; }],
  ["missing token timestamp", d => { d.tokenPrice!.priceAt = null; }],
  ["future provider timestamp", d => { d.tokenPrice!.priceAt!.unixMs = DEMO_NOW + 1; }],
  ["price newer than observation", d => { d.references[0].priceAt!.unixMs = DEMO_NOW - 500; }],
  ["stale token", d => { d.tokenPrice!.priceAt!.unixMs = DEMO_NOW - 60_001; }],
  ["stale snapshot", d => { d.observedAt!.unixMs = DEMO_NOW - 30_001; }],
  ["missing quote observation", d => { d.quote!.observedAt = null; }],
  ["stale liquidity observation", d => { d.liquidity!.observedAt!.unixMs = DEMO_NOW - 30_001; }],
  ["expired quote", d => { d.quote!.expiresAtMs = DEMO_NOW; }],
  ["nonexecutable quote", d => { d.quote!.executable = false; }],
  ["wrong quote side", d => { d.quote!.side = "sell"; }],
  ["wrong quote size", d => { d.quote!.quantityTokens = 11; }],
  ["low claimed slippage with adverse actual quote", d => { d.quote!.estimatedSlippageBps = 0; d.quote!.totalQuoteAmount = 3000; }],
  ["unknown session", d => { d.session!.session = "unknown"; }],
  ["halted session", d => { d.session!.session = "halted"; }],
  ["arithmetic overflow", d => { d.tokenPrice!.price = Number.MAX_VALUE; d.multiplier!.sharesPerToken = Number.MIN_VALUE; }],
  ["NaN price", d => { d.tokenPrice!.price = NaN; }],
];
for (const [name, mutate] of mutations) test(`${name} cannot permit review`, () => {
  const input = syntheticFixture("fresh-evidence");
  mutate(input);
  assert.equal(evaluateReferenceTruth(input, DEMO_NOW).decision, "WAIT");
});
test("runtime omissions and malformed policies fail closed", () => {
  for (const value of [undefined, null, {}, { mode: "live" }, { ...syntheticFixture("fresh-evidence"), available: undefined }]) assert.equal(evaluateReferenceTruth(value, DEMO_NOW).decision, "WAIT");
  for (const policy of [{ ...defaultPolicy, maxTokenAgeMs: Infinity }, { ...defaultPolicy, minIndependentProviders: 1 }, {}]) assert.equal(evaluateReferenceTruth(syntheticFixture("fresh-evidence"), DEMO_NOW, policy as TruthPolicy).decision, "WAIT");
});
test("configured age boundary is inclusive and evaluation is deterministic without mutation", () => {
  const input = syntheticFixture("fresh-evidence");
  input.tokenPrice!.priceAt!.unixMs = DEMO_NOW - defaultPolicy.maxTokenAgeMs;
  const original = structuredClone(input);
  assert.equal(evaluateReferenceTruth(input, DEMO_NOW).decision, "PROCEED_TO_REVIEW");
  assert.deepEqual(input, original);
  input.tokenPrice!.priceAt!.unixMs -= 1;
  assert.equal(evaluateReferenceTruth(input, DEMO_NOW).decision, "WAIT");
});
test("small gap remains MONITOR; configured extended session can permit review", () => {
  const input = syntheticFixture("fresh-evidence");
  assert.equal(evaluateReferenceTruth(input, DEMO_NOW, { ...defaultPolicy, minGapBps: 300 }).decision, "MONITOR");
  input.session!.session = "postmarket";
  assert.equal(evaluateReferenceTruth(input, DEMO_NOW).decision, "MONITOR");
  assert.equal(evaluateReferenceTruth(input, DEMO_NOW, { ...defaultPolicy, reviewSessions: ["postmarket"] }).decision, "PROCEED_TO_REVIEW");
});

test("removing any required nested field cannot permit review", () => {
  const baseline = syntheticFixture("fresh-evidence");
  function paths(value: unknown, parent: string[] = []): string[][] {
    if (!value || typeof value !== "object") return [];
    return Object.entries(value).flatMap(([key, child]) => [[...parent, key], ...paths(child, [...parent, key])]);
  }
  for (const path of paths(baseline)) {
    const input = structuredClone(baseline);
    let object = input as unknown as Record<string, unknown>;
    for (const key of path.slice(0, -1)) object = object[key] as Record<string, unknown>;
    delete object[path[path.length - 1]];
    assert.equal(evaluateReferenceTruth(input, DEMO_NOW).decision, "WAIT", `Missing ${path.join(".")}`);
  }
});
test("liquidity must also cover fee-inclusive quote notional", () => {
  const input = syntheticFixture("fresh-evidence");
  input.liquidity!.availableNotional = 2041;
  assert.equal(evaluateReferenceTruth(input, DEMO_NOW, { ...defaultPolicy, minLiquidityNotional: 0 }).decision, "WAIT");
});
