import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createSupabaseLive } from '../gateway/supabase-live';
import { createSupabaseTransport } from '../gateway/supabase-transport';
import { PRODUCTION_ORIGIN } from '../gateway/handler';
import { canonicalize, createEvidenceReceipt, verifyReceipt } from '../src/lib/competition/receipt';
import { unavailableObservation } from '../src/lib/competition/unavailable';
import type { LiveObservation } from '../src/lib/competition/model';

const at = 1791492478559;
// Historical recorded response used ONLY as a deterministic transport test double.
const recorded = JSON.parse(readFileSync('docs/deployment/supabase-gate-b-receipt.json', 'utf8')).receipt.observation as LiveObservation;
const fixture = () => structuredClone(recorded);
const req = (suffix = '', init: RequestInit = {}) => new Request('https://example.invalid/functions/v1/live-evidence' + suffix, { ...init, headers: { Origin: PRODUCTION_ORIGIN, ...init.headers } });
const options = { region: () => 'eu-central-1', clock: () => at };
async function configured(run: () => Promise<void>) {
  const keys = ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY', 'AFTERCLOSE_DEPLOYMENT_MODE', 'AFTERCLOSE_PREVIEW_MODE'];
  const before = keys.map(k => process.env[k]);
  try { process.env.BINANCE_API_KEY = 'test-only-key'; process.env.BINANCE_SECRET_KEY = 'test-only-secret'; process.env.AFTERCLOSE_DEPLOYMENT_MODE = 'competition-live'; delete process.env.AFTERCLOSE_PREVIEW_MODE; await run(); }
  finally { keys.forEach((k, i) => { if (before[i] === undefined) delete process.env[k]; else process.env[k] = before[i]; }); }
}

test('first miss evaluates; same-isolate hit retains values, both clocks and provenance with progressing age', () => configured(async () => {
  let now = at, calls = 0;
  const handler = createSupabaseLive({ ...options, clock: () => now, observe: async () => { calls++; return fixture(); } });
  const first = await handler(req('?forceFunctionRegion=eu-central-1')), a = await first.json();
  assert.equal(first.status, 200); assert.equal(first.headers.get('X-AfterClose-Cache'), 'MISS'); assert.equal(a.receipt.engine.result.decision, 'WAIT'); assert.equal(a.receipt.evidenceStatus, 'PARTIAL');
  now += 1000;
  const second = await handler(req()), b = await second.json();
  assert.equal(second.status, 200); assert.equal(second.headers.get('X-AfterClose-Cache'), 'HIT'); assert.equal(calls, 1);
  assert.deepEqual(a.receipt.observation, b.receipt.observation);
  assert.equal(b.receipt.fields[0].providerAtMs, a.receipt.fields[0].providerAtMs); assert.equal(b.receipt.fields[0].observedAtMs, a.receipt.fields[0].observedAtMs);
  assert.equal(b.receipt.freshness.observationAgeMs, a.receipt.freshness.observationAgeMs + 1000);
  assert.equal(b.receipt.freshness.providerDataAgeMs, a.receipt.freshness.providerDataAgeMs + 1000);
  assert.notEqual(a.receiptDigest, b.receiptDigest);
  for (const body of [a, b]) { const local = createEvidenceReceipt(body.receipt.observation, body.receipt.evaluatedAtMs, body.receipt.calendarReview); assert.equal(local.canonicalJson, canonicalize(body.receipt)); assert.equal(local.digest, body.receiptDigest); assert.ok(verifyReceipt(local)); }
  const same = await (await handler(req())).json(); assert.equal(same.receiptDigest, b.receiptDigest);
}));
test('expiration refreshes and cannot relabel old provider evidence LIVE', () => configured(async () => {
  let now = at, calls = 0; const handler = createSupabaseLive({ ...options, clock: () => now, observe: async () => { calls++; return fixture(); } });
  await handler(req()); now += 30_000;
  const response = await handler(req()), body = await response.json(); assert.equal(response.headers.get('X-AfterClose-Cache'), 'MISS'); assert.equal(calls, 2); assert.equal(body.receipt.freshness.status, 'STALE');
}));
test('fresh isolate performs permitted real capture path rather than configuration 503', () => configured(async () => {
  let calls = 0; const observe = async () => { calls++; return fixture(); };
  for (let i = 0; i < 2; i++) { const response = await createSupabaseLive({ ...options, observe })(req()); assert.equal(response.status, 200); assert.equal(response.headers.get('X-AfterClose-Cache'), 'MISS'); }
  assert.equal(calls, 2);
}));
test('provider failure has an explicit reason and a sixty-second cooldown with no synthetic fallback', () => configured(async () => {
  let now = at, calls = 0; const handler = createSupabaseLive({ ...options, clock: () => now, observe: async () => { calls++; throw Error('private provider error'); } });
  const first = await handler(req()); assert.equal(first.status, 503); assert.equal(first.headers.get('Retry-After'), '60'); assert.equal((await first.json()).reason, 'provider');
  now += 59000; const next = await handler(req()), body = await next.json(); assert.equal(next.status, 503); assert.equal(next.headers.get('X-AfterClose-Cache'), 'FAILURE_COOLDOWN'); assert.equal(next.headers.get('Retry-After'), '1'); assert.equal(calls, 1); assert.equal(body.receipt.observation.mode, 'live'); assert.equal(body.receipt.observation.quote, null); assert.equal(body.receipt.engine.result.decision, 'WAIT');
  now += 1000; await handler(req()); assert.equal(calls, 2);
}));
test('longer provider Retry-After extends failure cooldown and reports remaining seconds', () => configured(async () => {
  let now = at, calls = 0; const handler = createSupabaseLive({ ...options, clock: () => now, retryAfterMs: () => 120000, observe: async () => { calls++; return unavailableObservation('provider'); } });
  const first = await handler(req()); assert.equal(first.headers.get('Retry-After'), '120'); now += 60000;
  const second = await handler(req()); assert.equal(second.headers.get('Retry-After'), '60'); assert.equal(calls, 1);
}));
test('concurrent misses coalesce in one isolate', () => configured(async () => {
  let resolve!: (v: LiveObservation) => void, calls = 0;
  const handler = createSupabaseLive({ ...options, observe: () => { calls++; return new Promise(r => { resolve = r; }); } });
  const a = handler(req()), b = handler(req()); resolve(fixture());
  const responses = await Promise.all([a, b]); assert.deepEqual(responses.map(r => r.headers.get('X-AfterClose-Cache')), ['MISS', 'COALESCED']); assert.equal(calls, 1);
}));
test('request limit rejects request 121 without additional capture', () => configured(async () => {
  let calls = 0; const handler = createSupabaseLive({ ...options, observe: async () => { calls++; return fixture(); } });
  for (let i = 0; i < 120; i++) assert.equal((await handler(req())).status, 200);
  const response = await handler(req()); assert.equal(response.status, 429); assert.equal(response.headers.get('Retry-After'), '60'); assert.equal(calls, 1);
}));
test('exact CORS, GET-only, fixed asset/query and Frankfurt gates run before providers', async () => {
  let calls = 0; const handler = createSupabaseLive({ ...options, observe: async () => { calls++; return fixture(); } });
  for (const Origin of ['https://evil.invalid', '*', 'null', PRODUCTION_ORIGIN + '.evil.invalid']) { const r = await handler(req('', { headers: { Origin } })); assert.equal(r.status, 403); assert.equal(r.headers.get('Access-Control-Allow-Origin'), null); }
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD']) assert.equal((await handler(req('', { method }))).status, 405);
  for (const suffix of ['?asset=BTC', '?contract=0x123', '?chain=1', '?url=https://evil.invalid', '?forceFunctionRegion=us-east-1', '?forceFunctionRegion=eu-central-1&forceFunctionRegion=eu-central-1', '/other']) assert.equal((await handler(req(suffix))).status, 400);
  for (const name of ['Authorization', 'Content-Type']) assert.equal((await handler(req('', { headers: { [name]: 'test' } }))).status, 400);
  for (const region of [undefined, 'us-east-1', 'unknown']) assert.equal((await createSupabaseLive({ ...options, region: () => region })(req())).status, 503);
  for (const path of ['/validate', '/diagnostics']) assert.equal((await handler(req(path))).status, 404);
  const health = await handler(req('/health')); assert.equal(health.status, 200); assert.equal(health.headers.get('Access-Control-Allow-Origin'), PRODUCTION_ORIGIN); assert.equal(calls, 0);
});
test('genuinely missing configuration remains explicit; reflected credentials are rejected', () => configured(async () => {
  let calls = 0; const handler = createSupabaseLive({ ...options, observe: async () => { calls++; const f = fixture(); f.searchCompany = 'test-only-secret'; return f; } });
  delete process.env.BINANCE_API_KEY; const missing = await handler(req()); assert.equal(missing.status, 503); assert.equal((await missing.json()).reason, 'configuration'); assert.equal(calls, 0);
  process.env.BINANCE_API_KEY = 'test-only-key'; const reflected = await handler(req()); const text = await reflected.text(); assert.equal(reflected.status, 503); assert.ok(!text.includes('test-only-secret')); assert.ok(text.includes('UNSAFE_PROVIDER_RESPONSE'));
}));

test('transport bounds six Binance calls per 30 seconds, denies other destinations and non-Frankfurt', async () => {
  let now = at, calls = 0; const outbound: typeof fetch = async () => { calls++; return Response.json({}); };
  const transport = createSupabaseTransport(outbound, () => 'eu-central-1', () => now);
  const url = 'https://web3.binance.com/build/api/v1/dex/market/rwa/platforms', init = { redirect: 'error' as const };
  for (let i = 0; i < 6; i++) await transport.fetch(url, init);
  await assert.rejects(transport.fetch(url, init)); assert.equal(calls, 6); now += 30000; await transport.fetch(url, init); assert.equal(calls, 7);
  for (const denied of ['https://evil.invalid', 'https://web3.binance.com/build/api/v1/trade', 'http://web3.binance.com/build/api/v1/dex/market/rwa/platforms']) await assert.rejects(transport.fetch(denied, init));
  await assert.rejects(transport.fetch(url, { redirect: 'follow' })); await assert.rejects(createSupabaseTransport(outbound, () => 'us-east-1').fetch(url, init)); assert.equal(calls, 7);
});
test('transport honors Retry-After seconds and dates without retrying', async () => {
  for (const retry of ['120', new Date(at + 120000).toUTCString()]) {
    let now = at, calls = 0; const transport = createSupabaseTransport(async () => { calls++; return new Response(null, { status: 429, headers: { 'Retry-After': retry } }); }, () => 'eu-central-1', () => now);
    const url = 'https://web3.binance.com/build/api/v1/dex/market/rwa/platforms', init = { redirect: 'error' as const };
    await transport.fetch(url, init); now += 61000; await assert.rejects(transport.fetch(url, init)); assert.equal(calls, 1); assert.ok(transport.retryAfterMs() > 58000); now += 60000; await transport.fetch(url, init); assert.equal(calls, 2);
  }
});
