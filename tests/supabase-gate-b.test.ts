import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { createSupabaseGateB } from '../gateway/supabase-gate-b';
import { competitionOperations } from '../src/lib/competition/observe';
import { PRODUCTION_ORIGIN } from '../gateway/handler';
import { canonicalize, createEvidenceReceipt, verifyReceipt } from '../src/lib/competition/receipt';
import { mvpContract } from '../src/lib/binance/schemas';
import type { ResponseAudit } from '../src/lib/binance/client';
const permit = 'a'.repeat(64), at = 1791490000000;
const config = { region: () => 'eu-central-1', permitDigest: createHash('sha256').update(permit).digest('hex'), expiresAt: at + 100000, clock: () => at };
const request = (path = '/validate', headers: Record<string, string> = {}) => new Request('https://example.invalid/functions/v1/live-evidence' + path, { headers: { Origin: PRODUCTION_ORIGIN, 'X-AfterClose-Validation': permit, ...headers } });
function operations(code = '0') {
  const calls: string[] = [];
  const mark = (endpoint: ResponseAudit['endpoint'], record?: (a: ResponseAudit) => void) => { calls.push(endpoint); record?.({ endpoint, status: 200, code: endpoint === 'platforms' ? code : '0', latencyMs: 1, observedAtMs: at - 10, responseTimestamp: at - 20 }); };
  const identity = { binanceChainId: '56' as const, platformId: 'ondo', tokenContractAddress: mvpContract };
  const token = { ...identity, assetType: 1 as const, tokenName: 'NVIDIA (Ondo)', tokenSymbol: 'NVDAon', underlyingName: 'NVIDIA', underlyingTicker: 'NVDA', decimals: '18' };
  const ops: typeof competitionOperations = {
    platforms: async record => { mark('platforms', record); if (code !== '0') throw Error('test provider rejection'); return [{ platformId: 'ondo', chainDistribution: [{ binanceChainId: '56', tokenCount: 1 }] }]; },
    tokens: async record => { mark('tokens', record); return [token]; },
    search: async (_keyword, record) => { mark('search', record); return [{ ticker: 'NVDA', companyName: 'Nvidia Corp', assets: [token] }]; },
    chains: async record => { mark('chain-list', record); return [{ binanceChainId: '56', name: 'BSC' }]; },
    prices: async (_contract, record) => { mark('price', record); return [{ ...identity, tokenPrice: '240', tokenPriceUpdatedAt: at - 1000 }]; },
    underlyingMarket: async (_contract, record) => { mark('underlying-market', record); return identity; },
    issuer: async () => { calls.push('issuer'); return { availability: 'unavailable', evidence: null, observedAtMs: at, reason: 'test' }; },
  };
  return { ops, calls };
}
test('Gate B rejects missing permits, expired permits, wrong regions and origins before network', async () => {
  const { ops, calls } = operations();
  for (const overrides of [{ permitDigest: undefined }, { expiresAt: at }, { region: () => 'us-east-1' }, { region: () => undefined }]) {
    const handler = createSupabaseGateB({ ...config, ...overrides, operations: ops });
    assert.notEqual((await handler(request())).status, 200);
  }
  const handler = createSupabaseGateB({ ...config, operations: ops });
  for (const headers of [{ Origin: 'https://evil.invalid' }, { 'X-AfterClose-Validation': 'b'.repeat(64) }, { Authorization: 'test' }] as Record<string, string>[]) assert.notEqual((await handler(request('/validate', headers))).status, 200);
  assert.equal((await handler(request('/diagnostics'))).status, 404);
  assert.equal((await handler(request(''))).status, 503);
  assert.deepEqual(calls, []);
});
test('one rejected probe stops all provider work; no retry and no cache capture', async () => {
  for (const code of ['40304', '42900', '12345']) {
    const { ops, calls } = operations(code); const network: boolean[] = [];
    const handler = createSupabaseGateB({ ...config, operations: ops, network: v => network.push(v) });
    const result = await (await handler(request())).json();
    assert.equal(result.fullEvaluationAttempted, false); assert.equal(result.probe.code, code);
    assert.equal((await handler(request())).status, 409); assert.equal((await handler(request(''))).status, 503);
    assert.deepEqual(calls, ['platforms']); assert.deepEqual(network, [true, false]);
  }
});
test('successful probe is reused; cached repeat preserves evidence and verifies canonical receipt', async () => {
  const names = ['BINANCE_API_KEY', 'BINANCE_SECRET_KEY', 'AFTERCLOSE_DEPLOYMENT_MODE'];
  const before = names.map(k => process.env[k]);
  try {
    process.env.BINANCE_API_KEY = 'test-only-key'; process.env.BINANCE_SECRET_KEY = 'test-only-secret'; process.env.AFTERCLOSE_DEPLOYMENT_MODE = 'competition-live';
    let now = at; const { ops, calls } = operations();
    const handler = createSupabaseGateB({ ...config, clock: () => now, operations: ops });
    const result = await (await handler(request())).json();
    assert.equal(result.fullEvaluationAttempted, true); assert.equal(result.gateway.receipt.transportVerified, true);
    assert.equal(calls.filter(c => c === 'platforms').length, 1); assert.equal(calls.length, 7);
    now += 1;
    const response = await handler(request('')); const cached = await response.json();
    assert.equal(response.headers.get('X-AfterClose-Cache'), 'HIT'); assert.equal(calls.length, 7);
    assert.deepEqual(cached.receipt.observation, result.gateway.receipt.observation);
    assert.equal(cached.receipt.evaluatedAtMs, now);
    const local = createEvidenceReceipt(cached.receipt.observation, now, cached.receipt.calendarReview);
    assert.equal(cached.receiptDigest, local.digest); assert.equal(canonicalize(cached.receipt), local.canonicalJson); assert.ok(verifyReceipt(local));
    now += 30000; assert.equal((await handler(request(''))).status, 503); assert.equal(calls.length, 7);
    assert.equal((await createSupabaseGateB({ ...config, operations: ops })(request(''))).status, 503); assert.equal(calls.length, 7);
  } finally { names.forEach((k, i) => { if (before[i] === undefined) delete process.env[k]; else process.env[k] = before[i]; }); }
});

