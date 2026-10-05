import test from 'node:test';
import assert from 'node:assert/strict';
import { syntheticWorker } from '../cloudflare/guard.mjs';

test('Cloudflare rejects absent and non-exact bindings before invoking the application', async () => {
  let calls = 0;
  const app = syntheticWorker({ fetch: async () => { calls++; return new Response('app'); } });
  for (const mode of [undefined, null, '', 'live', 'Synthetic', 'synthetic ', ' synthetic', 'synthetic\0', true, ['synthetic']]) {
    const request = new Request('https://example.invalid/demo/live?AFTERCLOSE_PREVIEW_MODE=synthetic', {
      method: 'POST', headers: { AFTERCLOSE_PREVIEW_MODE: 'synthetic', Cookie: 'AFTERCLOSE_PREVIEW_MODE=synthetic' },
      body: JSON.stringify({ AFTERCLOSE_PREVIEW_MODE: 'synthetic' }),
    });
    const response = await app.fetch(request, { AFTERCLOSE_PREVIEW_MODE: mode }, {});
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
  assert.equal(calls, 0);
});

test('Cloudflare delegates exact synthetic binding and preserves response and request', async () => {
  const request = new Request('https://example.invalid/?mode=live');
  const env = { AFTERCLOSE_PREVIEW_MODE: 'synthetic' };
  const ctx = {};
  const expected = new Response('SYNTHETIC DEMO');
  const app = syntheticWorker({ fetch: async (r: Request, e: unknown, c: unknown) => {
    assert.equal(r, request); assert.equal(e, env); assert.equal(c, ctx); return expected;
  } });
  assert.equal(await app.fetch(request, env, ctx), expected);
});
