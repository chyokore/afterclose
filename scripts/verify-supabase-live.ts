// Two sequential hosted reads only; no retries or local provider requests.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { canonicalize, createEvidenceReceipt, verifyReceipt } from '../src/lib/competition/receipt';
const out = '.tools/supabase-live';
const base = 'https://wakuqrnxjwikvlrxgezg.supabase.co/functions/v1/live-evidence';
const origin = 'https://afterclose-preview.pages.dev';
async function main() {
  await mkdir(out, { recursive: true });
  const build = JSON.parse(await readFile(out + '/build.json', 'utf8'));
  const preflight = JSON.parse(await readFile(out + '/preflight.json', 'utf8'));
  if (!preflight.pass || preflight.commit !== build.identity.commit || Date.now() - preflight.checkedAtMs > 30 * 60_000) throw Error('Fresh region/build preflight required');
  await writeFile(out + '/hosted-started.json', JSON.stringify({ at: new Date().toISOString(), maximumRequests: 2, automaticRetries: 0 }), { flag: 'wx' });
  const reports = [];
  for (const name of ['first', 'repeat']) {
    const start = performance.now();
    const response = await fetch(base + '?forceFunctionRegion=eu-central-1', { redirect: 'error', signal: AbortSignal.timeout(45000), headers: { Origin: origin } });
    const body = await response.json();
    const result = { at: new Date().toISOString(), status: response.status, elapsedMs: performance.now() - start, region: response.headers.get('x-sb-edge-region'), runtimeRegion: response.headers.get('x-afterclose-region'), cache: response.headers.get('x-afterclose-cache'), binanceCalls: Number(response.headers.get('x-afterclose-provider-calls')), retryAfter: response.headers.get('retry-after'), cors: response.headers.get('access-control-allow-origin'), body };
    await writeFile(`${out}/${name}.json`, JSON.stringify(result, null, 2));
    if (response.status !== 200 || result.region !== 'eu-central-1' || result.runtimeRegion !== 'eu-central-1' || body.build?.commit !== build.identity.commit || !body.receipt?.transportVerified || body.receipt.observation.audits.some((a: { status: number; code: string }) => a.status !== 200 || a.code !== '0')) throw Error('Hosted evidence check failed; do not retry');
    if (!response.headers.has('x-afterclose-provider-calls') || !['MISS', 'HIT', 'COALESCED'].includes(result.cache ?? '') || !Number.isInteger(result.binanceCalls) || result.binanceCalls < 0 || result.binanceCalls > 6 || result.cache !== 'MISS' && result.binanceCalls !== 0) throw Error('Invalid cache accounting');
    const envelope = { receipt: body.receipt, canonicalJson: canonicalize(body.receipt), digest: body.receiptDigest };
    const local = createEvidenceReceipt(body.receipt.observation, body.receipt.evaluatedAtMs, body.receipt.calendarReview);
    if (!verifyReceipt(envelope) || local.canonicalJson !== envelope.canonicalJson || local.digest !== envelope.digest) throw Error('Receipt mismatch; do not retry');
    if (name === 'repeat' && result.cache === 'HIT') {
      const first = JSON.parse(await readFile(out + '/first.json', 'utf8')).body.receipt;
      if (canonicalize(first.observation) !== canonicalize(body.receipt.observation) || body.receipt.evaluatedAtMs < first.evaluatedAtMs || body.receipt.fields[0].observationAgeMs - first.fields[0].observationAgeMs !== body.receipt.evaluatedAtMs - first.evaluatedAtMs) throw Error('Cached evidence clocks changed');
    }
    await writeFile(`${out}/${name}-receipt.json`, JSON.stringify(envelope, null, 2));
    reports.push({ request: name, status: result.status, elapsedMs: result.elapsedMs, region: result.region, cache: result.cache, binanceCalls: result.binanceCalls, equivalence: true, digest: envelope.digest, observedAtMs: body.receipt.fields[0].observedAtMs, providerAtMs: body.receipt.fields[0].providerAtMs, evaluatedAtMs: body.receipt.evaluatedAtMs, freshness: body.receipt.freshness, verdict: body.receipt.engine.result.decision, completeness: body.receipt.evidenceStatus });
  }
  await writeFile(out + '/hosted-verification.json', JSON.stringify({ pass: true, reports }, null, 2));
  console.log(JSON.stringify({ pass: true, reports }, null, 2));
}
main().catch(() => { console.error('Hosted verification stopped. Inspect saved safe evidence; no automatic retries.'); process.exitCode = 1; });
