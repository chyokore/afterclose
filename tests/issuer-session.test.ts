import assert from "node:assert/strict";
import test from "node:test";
import { parseOndoPage, multiplierBlocker, multiplierEvidenceSchema } from "../src/lib/issuer/multiplier";
import { observeNasdaqSchedule, nasdaqSchedule } from "../src/lib/session/nasdaq-calendar";
import capture from "./fixtures/ondo-page-metadata.json";
import { syntheticFixture, DEMO_NOW } from "../src/demo/reference-fixtures";
import { evaluateReferenceTruth } from "../src/lib/reference-truth/engine";

const observed = Date.parse("2026-09-26T18:00:00Z");
// Captured issuer fields in a minimal transport wrapper, not a fabricated live response.
const page = (record: unknown) => `<script>self.__next_f.push(${JSON.stringify([1, `a:${JSON.stringify(record)}`])})</script>`;
test("captured Ondo identity and exact decimal remain undated and unverified", () => {
  const r = parseOndoPage(page(capture), observed);
  assert.equal(r.availability, "reported");
  assert.equal(r.evidence?.value, "1.0017152487959898");
  assert.equal(r.evidence?.chainId, 56);
  assert.equal(r.evidence?.effectiveAtMs, null);
  assert.equal(r.evidence?.validUntilMs, null);
  assert.ok(multiplierBlocker(r.evidence, observed, "live"));
});
test("missing multiplier and changed or conflicting page metadata fail closed", () => {
  assert.ok(multiplierBlocker(null, observed, "live"));
  for (const html of ["", page({ ...capture, sharesMultiplier: null }), page(capture) + page(capture), page({ ...capture, supportedNetworks: [] }), page({ ...capture, ticker: "OTHER" })]) {
    assert.equal(parseOndoPage(html, observed).evidence, null);
  }
});
test("invalid multiplier units and malformed decimals never qualify", () => {
  const m = parseOndoPage(page(capture), observed).evidence!;
  assert.equal(multiplierEvidenceSchema.safeParse({ ...m, units: "tokens-per-share" }).success, false);
  for (const value of ["NaN", "Infinity", "1e3", "-1", "0", 1.01]) assert.equal(multiplierEvidenceSchema.safeParse({ ...m, value }).success, false);
});
test("historical issuer observations do not manufacture current applicability", () => {
  const m = parseOndoPage(page(capture), observed).evidence!;
  assert.ok(multiplierBlocker(m, observed + 86_400_000, "live"));
  assert.ok(multiplierBlocker({ ...m, verification: "verified", effectiveAtMs: observed - 100, validUntilMs: observed }, observed, "live"));
});
test("SYNTHETIC corporate-action effective boundaries and provenance", () => {
  const m = { ...parseOndoPage(page(capture), observed).evidence!, value: "1.125000000000000001", mode: "synthetic", verification: "verified", effectiveAtMs: observed, validUntilMs: observed + 1000 };
  assert.equal(multiplierBlocker(m, observed, "synthetic"), null);
  assert.ok(multiplierBlocker(m, observed - 1, "synthetic"));
  assert.ok(multiplierBlocker(m, observed + 1000, "synthetic"));
  assert.ok(multiplierBlocker(m, observed, "live"));
  assert.ok(multiplierBlocker({ ...m, effectiveAtMs: observed + 1 }, observed, "synthetic"));
});
// Hypothetical review observations used to exercise the published 2026 rules, never production fixtures.
function session(iso: string) {
  const at = Date.parse(iso);
  return observeNasdaqSchedule(at, { ...nasdaqSchedule, mode: "synthetic", observedAtMs: at }, "synthetic");
}
test("SYNTHETIC weekend and official holiday schedule cases", () => {
  assert.equal(session("2026-09-26T16:00:00Z").session, "closed");
  assert.equal(session("2026-07-03T16:00:00Z").session, "closed");
  assert.equal(session("2026-11-26T16:00:00Z").session, "closed");
});
test("SYNTHETIC early close does not extend regular trading past 13:00 ET", () => {
  assert.equal(session("2026-11-27T17:59:59Z").session, "regular");
  const close = session("2026-11-27T18:00:00Z");
  assert.equal(close.session, "unknown");
  assert.match(close.reason, /early-close extended hours/);
});
test("SYNTHETIC DST transitions use New York rather than a fixed UTC offset", () => {
  assert.equal(session("2026-03-06T14:29:59Z").session, "premarket");
  assert.equal(session("2026-03-06T14:30:00Z").session, "regular");
  assert.equal(session("2026-03-09T13:30:00Z").session, "regular");
  assert.equal(session("2026-03-08T07:00:00Z").session, "closed");
  assert.equal(session("2026-11-02T14:29:59Z").session, "premarket");
  assert.equal(session("2026-11-02T14:30:00Z").session, "regular");
});
test("SYNTHETIC regular and extended session boundaries remain schedule-only", () => {
  assert.equal(session("2026-09-25T08:00:00Z").session, "premarket");
  assert.equal(session("2026-09-25T20:00:00Z").session, "postmarket");
  assert.equal(session("2026-09-26T00:00:00Z").session, "closed");
  assert.equal(session("2026-09-25T15:00:00Z").authoritativeStatus, "unverified");
});
test("missing, stale, future and out-of-coverage calendars stay unknown", () => {
  for (const raw of [null, {}, { ...nasdaqSchedule, observedAtMs: observed - 8 * 86_400_000 }, { ...nasdaqSchedule, observedAtMs: observed + 1 }]) {
    assert.equal(observeNasdaqSchedule(observed, raw).session, "unknown");
  }
  assert.equal(session("2026-12-06T15:00:00Z").session, "unknown");
  assert.equal(observeNasdaqSchedule(NaN).session, "unknown");
});
test("synthetic calendar cannot enter live display; schedule cannot supply missing engine evidence", () => {
  assert.equal(observeNasdaqSchedule(observed, { ...nasdaqSchedule, mode: "synthetic" }).availability, "unavailable");
  const e = syntheticFixture("fresh-evidence");
  e.multiplier = null;
  assert.equal(evaluateReferenceTruth(e, DEMO_NOW).decision, "WAIT");
  e.mode = "live";
  assert.equal(evaluateReferenceTruth(e, DEMO_NOW).decision, "WAIT");
});
