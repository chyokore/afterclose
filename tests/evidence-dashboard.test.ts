import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ageLabel, timestampLabel, evidenceProvenance } from "../src/lib/evidence/presentation";
import { unavailableEquityProvider, unavailableTruth } from "../src/lib/equity/provider";
import { evaluateReferenceTruth } from "../src/lib/reference-truth/engine";
import { DEMO_NOW, syntheticFixture, type Scenario } from "../src/demo/reference-fixtures";
import { toReferenceEvidence } from "../src/lib/binance/reference-adapter";
import fixture from "./fixtures/binance-rwa.json";

test("unavailable equity adapter never manufactures price, provider or event time", async () => {
  const value = await unavailableEquityProvider.observe("NVDA", DEMO_NOW);
  assert.equal(value.availability, "unavailable");
  assert.equal(value.price, null); assert.equal(value.marketDataAt, null); assert.equal(value.provider, null);
  assert.equal(value.observedAtMs, DEMO_NOW); assert.equal(value.session, "unknown");
  assert.equal(evaluateReferenceTruth(unavailableTruth(DEMO_NOW), DEMO_NOW).decision, "WAIT");
  await assert.rejects(unavailableEquityProvider.observe("", NaN));
});
test("timestamp presentation preserves missing values and handles New York DST", () => {
  assert.equal(timestampLabel(null), "Unavailable"); assert.equal(ageLabel(undefined, DEMO_NOW), "Unavailable");
  assert.equal(ageLabel(DEMO_NOW + 1, DEMO_NOW), "Future timestamp — invalid evidence");
  assert.match(timestampLabel(Date.parse("2026-01-15T15:00:00Z"), "America/New_York"), /10:00:00 EST/);
  assert.match(timestampLabel(Date.parse("2026-07-15T15:00:00Z"), "America/New_York"), /11:00:00 EDT/);
});
for (const scenario of ["missing-independent", "stale-token", "closed-stale-reference", "missing-multiplier"] as Scenario[]) {
  test(`dashboard synthetic scenario ${scenario} fails closed through real engine`, () => {
    const evidence = syntheticFixture(scenario);
    const result = evaluateReferenceTruth(evidence, DEMO_NOW);
    assert.equal(result.decision, "WAIT"); assert.equal(result.mode, "synthetic"); assert.equal(result.execution, "DISABLED");
    if (scenario === "missing-multiplier") assert.equal(result.normalizedTokenPrice, null);
    if (scenario === "stale-token") assert.equal(result.tokenPriceAgeMs, 3_600_000);
  });
}
test("live provider evidence does not upgrade raw market status, multiplier or missing timestamp", () => {
  const token = fixture.tokens.find(t => t.tokenSymbol === "NVDAon")!;
  const input = { token, quote: { ...fixture.price[0], tokenPriceUpdatedAt: null }, market: { ...fixture.market, statusInfo: { marketStatus: "regular", openState: true } }, fetchedAt: new Date(DEMO_NOW).toISOString() };
  const evidence = toReferenceEvidence(input);
  assert.equal(evidence.session?.session, "unknown"); assert.equal(evidence.multiplier, null); assert.equal(evidence.tokenPrice?.priceAt, null);
  assert.equal(evaluateReferenceTruth(evidence, DEMO_NOW).decision, "WAIT");
  assert.ok(evidenceProvenance.some(r => r.field === "Per-share reference" && r.status.includes("not independent")));
  assert.ok(evidenceProvenance.some(r => r.field === "Contract corroboration" && r.status.includes("Historical")));
});
test("synthetic evidence stays isolated from production providers and dashboard", () => {
  const files: string[] = ["src/app/page.tsx"];
  function walk(path: string) { for (const name of readdirSync(path)) { const file = join(path, name); if (statSync(file).isDirectory()) walk(file); else if (/\.tsx?$/.test(file)) files.push(file); } }
  walk("src/lib");
  for (const file of files) assert.doesNotMatch(readFileSync(file, "utf8"), /(?:from\s*|import\s*\()["'][^"']*(?:demo|fixtures)/, file);
  const synthetic = syntheticFixture("fresh-evidence");
  synthetic.mode = "live";
  assert.equal(evaluateReferenceTruth(synthetic, DEMO_NOW).decision, "WAIT");
});
