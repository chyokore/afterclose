import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import fixture from "./fixtures/binance-rwa.json";
import { tokenSchema, searchSchema, priceSchema, marketSchema, platformSchema, selectMvp } from "../src/lib/binance/schemas";
import { toReferenceEvidence } from "../src/lib/binance/reference-adapter";
import { evaluateReferenceTruth } from "../src/lib/reference-truth/engine";
const catalog = z.array(tokenSchema).parse(fixture.tokens);
const token = selectMvp(catalog)!;
const bundle = { token, quote: fixture.price[0], market: fixture.market, fetchedAt: "2026-09-26T17:00:00.000Z" };
test("captured public RWA structures validate, including nullable asset types and Solana search", () => {
  assert.ok(platformSchema.parse(fixture.platforms).length);
  assert.equal(catalog.filter(t => t.assetType === null).length, 3);
  assert.ok(searchSchema.parse(fixture.search)[0].assets.some(a => a.binanceChainId === "CT_501"));
  assert.equal(priceSchema.parse(bundle.quote).tokenPriceUpdatedAt, 1790440344443);
  assert.equal(marketSchema.parse(bundle.market).statusInfo?.marketStatus, "offhours");
});
test("identity and chain-specific addresses remain required", () => {
  for (const change of [{ tokenContractAddress: "bad" }, { binanceChainId: "1" }, { platformId: "" }, { underlyingTicker: "" }]) assert.equal(tokenSchema.safeParse({ ...token, ...change }).success, false);
  const changed = structuredClone(fixture.search);
  changed[0].assets[0].tokenContractAddress = changed[0].assets[1].tokenContractAddress;
  assert.equal(searchSchema.safeParse(changed).success, false);
  assert.equal(selectMvp([{ ...token, assetType: null }]), undefined);
});
test("documented numeric and observed string decimals are supported", () => {
  assert.equal(tokenSchema.parse({ ...token, decimals: 18 }).decimals, 18);
  assert.equal(toReferenceEvidence(bundle).token?.decimals, 18);
});
test("real Binance evidence cannot imply independent reference or execution readiness", () => {
  const evidence = toReferenceEvidence(bundle);
  assert.equal(evidence.tokenPrice?.priceAt?.unixMs, 1790440344443);
  assert.equal(evidence.session?.session, "unknown");
  assert.deepEqual(evidence.references, []);
  assert.equal(evidence.multiplier, null);
  assert.equal(evidence.liquidity, null);
  assert.equal(evidence.quote, null);
  assert.equal(evaluateReferenceTruth(evidence, Date.parse(bundle.fetchedAt)).decision, "WAIT");
});
test("missing provider timestamp is not replaced by observation time", () => {
  const evidence = toReferenceEvidence({ ...bundle, quote: { ...bundle.quote, tokenPriceUpdatedAt: null } });
  assert.equal(evidence.tokenPrice?.priceAt, null);
  assert.equal(evaluateReferenceTruth(evidence, Date.parse(bundle.fetchedAt)).decision, "WAIT");
});
test("inconsistent endpoint identities reject before engine mapping", () => {
  assert.throws(() => toReferenceEvidence({ ...bundle, market: { ...bundle.market, platformId: "bstock" } }));
});
test("unavailable decimals and prices stay unavailable", () => {
  const evidence = toReferenceEvidence({ ...bundle, token: { ...token, decimals: null }, quote: { ...bundle.quote, tokenPrice: null } });
  assert.equal(evidence.token, null);
  assert.equal(evidence.tokenPrice, null);
  assert.equal(evaluateReferenceTruth(evidence, Date.parse(bundle.fetchedAt)).decision, "WAIT");
});
