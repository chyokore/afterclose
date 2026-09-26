import assert from "node:assert/strict";
import test from "node:test";
import { loadRwa } from "../src/lib/binance/rwa";
import { toReferenceEvidence } from "../src/lib/binance/reference-adapter";
import { evaluateReferenceTruth, defaultPolicy } from "../src/lib/reference-truth/engine";
import { snapshotMessage, failureCopy } from "../src/lib/evidence/status";
import capture from "./fixtures/binance-rwa.json";

test("SYNTHETIC API failures become sanitized actionable states, never fallback data", async t => {
  const fetchBefore = globalThis.fetch, warnBefore = console.warn;
  const saved = ["BINANCE_API_KEY", "BINANCE_SECRET_KEY", "BINANCE_WEB3_BASE_URL"].map(k => [k, process.env[k]] as const);
  t.after(() => { globalThis.fetch = fetchBefore; console.warn = warnBefore; for (const [k,v] of saved) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
  process.env.BINANCE_API_KEY = "synthetic-key"; process.env.BINANCE_SECRET_KEY = "synthetic-secret";
  delete process.env.BINANCE_WEB3_BASE_URL;
  const logs: string[] = []; console.warn = (...args: unknown[]) => { logs.push(JSON.stringify(args)); };
  const cases = [
    { failure: "timeout", respond: async () => { throw new DOMException("synthetic-secret", "TimeoutError"); } },
    { failure: "timeout", respond: async () => new Response(new ReadableStream({ start(controller) { controller.error(new DOMException("synthetic-secret", "TimeoutError")); } })) },
    { failure: "authentication", respond: async () => Response.json({ private: "synthetic-secret" }, {status:401}) },
    { failure: "rate-limit", respond: async () => Response.json({ private: "synthetic-secret" }, {status:429}) },
    { failure: "schema", respond: async () => Response.json({ code:0, success:true, data:"synthetic-secret" }) },
    { failure: "provider", respond: async () => Response.json({ code:999, success:false, msg:"synthetic-secret" }) },
  ] as const;
  for (const c of cases) {
    globalThis.fetch = c.respond;
    const result = await loadRwa();
    assert.equal(result.state, "error");
    if (result.state !== "error") throw new Error("Expected unavailable evidence");
    assert.equal(result.failure, c.failure);
    assert.ok(failureCopy[result.failure].action.length > 20);
    assert.ok(!("quote" in result)); assert.ok(!JSON.stringify(result).includes("synthetic-secret"));
  }
  assert.ok(!logs.join("").includes("synthetic-secret"));
});
test("SYNTHETIC missing-price response retains metadata but cannot qualify", async t => {
  const oldFetch = globalThis.fetch;
  const saved = ["BINANCE_API_KEY", "BINANCE_SECRET_KEY", "BINANCE_WEB3_BASE_URL"].map(k => [k, process.env[k]] as const);
  t.after(() => { globalThis.fetch = oldFetch; for (const [k,v] of saved) { if (v === undefined) delete process.env[k]; else process.env[k] = v; } });
  process.env.BINANCE_API_KEY = "synthetic-key"; process.env.BINANCE_SECRET_KEY = "synthetic-secret"; delete process.env.BINANCE_WEB3_BASE_URL;
  const bodies: Record<string, unknown> = { platforms:capture.platforms, tokens:capture.tokens, search:capture.search, price:capture.price.map(q => ({...q,tokenPrice:null})), "underlying-market":capture.market };
  globalThis.fetch = async input => Response.json({code:0, success:true, data:bodies[new URL(String(input)).pathname.split("/").at(-1)!]});
  const result = await loadRwa();
  assert.equal(result.state,"connected");
  if(result.state !== "connected") throw new Error("Expected metadata bundle");
  assert.equal(result.quote.tokenPrice,null);
  const evidence = toReferenceEvidence(result);
  assert.equal(evidence.tokenPrice,null); assert.equal(evidence.multiplier,null);
  assert.deepEqual(evidence.references,[]); assert.equal(evidence.quote,null);
  assert.equal(evaluateReferenceTruth(evidence,Date.parse(result.fetchedAt)).decision,"WAIT");
});
test("historical snapshots ask for reassessment without rewriting any evidence clocks", () => {
  const at = Date.parse("2026-09-26T12:00:00Z");
  assert.match(snapshotMessage(at,at+defaultPolicy.maxObservationAgeMs+1,defaultPolicy.maxObservationAgeMs),/Historical snapshot/);
  assert.doesNotMatch(snapshotMessage(at,at+defaultPolicy.maxObservationAgeMs,defaultPolicy.maxObservationAgeMs),/Historical/);
  assert.match(snapshotMessage(at,at-1,defaultPolicy.maxObservationAgeMs),/cannot be verified/);
  assert.match(snapshotMessage(at,at,defaultPolicy.maxObservationAgeMs),/does not establish a fresh underlying/);
});
