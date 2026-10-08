// Exactly one validation invocation, never retried, including ambiguous failures.
// The hosted adapter conditionally evaluates only after its probe succeeds.
import { readFile, writeFile } from 'node:fs/promises';
const out = '.tools/supabase-gate-b';
const base = 'https://wakuqrnxjwikvlrxgezg.supabase.co/functions/v1/live-evidence';
const origin = 'https://afterclose-preview.pages.dev';
async function main() {
  const { permit, expiresAt } = JSON.parse(await readFile(out + '/permit.json', 'utf8'));
  if (Date.now() >= expiresAt) throw Error('Expired validation window');
  // Exclusive creation prevents accidentally re-running an ambiguous request.
  await writeFile(out + '/invocation-started.json', JSON.stringify({ at: new Date().toISOString(), automaticRetries: 0 }), { flag: 'wx' });
  const start = performance.now();
  const response = await fetch(base + '/validate?forceFunctionRegion=eu-central-1', { redirect: 'error', signal: AbortSignal.timeout(90000), headers: { Origin: origin, 'X-AfterClose-Validation': permit } });
  const body = await response.json();
  const result = { at: new Date().toISOString(), httpStatus: response.status, elapsedMs: performance.now() - start, region: response.headers.get('x-sb-edge-region'), cors: response.headers.get('access-control-allow-origin'), body };
  await writeFile(out + '/hosted-result.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ httpStatus: result.httpStatus, region: result.region, elapsedMs: result.elapsedMs, reason: body.reason, probe: body.probe, fullEvaluationAttempted: body.fullEvaluationAttempted }));
  if (body.fullEvaluationAttempted && body.gateway?.receipt?.observation?.state === 'connected') {
    const cachedStart = performance.now();
    const cached = await fetch(base + '?forceFunctionRegion=eu-central-1', { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Origin: origin } });
    const cachedBody = await cached.json();
    await writeFile(out + '/cached-result.json', JSON.stringify({ at: new Date().toISOString(), httpStatus: cached.status, elapsedMs: performance.now() - cachedStart, region: cached.headers.get('x-sb-edge-region'), cache: cached.headers.get('x-afterclose-cache'), body: cachedBody }, null, 2));
    console.log(JSON.stringify({ cachedStatus: cached.status, cache: cached.headers.get('x-afterclose-cache'), additionalProviderCalls: 0 }));
  }
}
main().catch(() => { console.error('Gate B invocation unavailable. Do not retry: inspect the safe result and invocation ledger.'); process.exitCode = 1; });
