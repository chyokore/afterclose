import { createHash, timingSafeEqual } from 'node:crypto';
import { gatewayResponse, PRODUCTION_ORIGIN } from './handler';
import { cachedOperations } from './metadata-cache';
import { competitionOperations, observeCompetition } from '../src/lib/competition/observe';
import { containsCredentialValue } from '../src/lib/secret-boundary';
import { unavailableObservation } from '../src/lib/competition/unavailable';
import type { ResponseAudit } from '../src/lib/binance/client';
import type { LiveObservation } from '../src/lib/competition/model';
import { GATEWAY_BUILD } from './build-info';

type Options = {
  region: () => string | undefined;
  permitDigest?: string;
  expiresAt?: number;
  clock?: () => number;
  operations?: typeof competitionOperations;
  network?: (enabled: boolean) => void;
};

// A bounded validation adapter, not a public trigger for recurring provider work.
// The caller makes one non-retried request. The permit expires and is removed
// after validation. A separate cache request NEVER captures on a cold instance.
export function createSupabaseGateB(options: Options) {
  const clock = options.clock ?? Date.now;
  const ops = cachedOperations(options.operations, clock);
  let started = false;
  let captured: { observation: LiveObservation; at: number } | undefined;
  return async (request: Request): Promise<Response> => {
    const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' });
    const deployment = { provider: 'Supabase', runtimeRegion: options.region() === 'eu-central-1' ? 'eu-central-1' : 'unverified', mode: 'gate-b-validation', build: GATEWAY_BUILD };
    const reply = (body: object, status = 200) => {
      if (containsCredentialValue(body)) return Response.json({ reason: 'UNSAFE_PROVIDER_RESPONSE' }, { status: 503, headers });
      const json = JSON.stringify({ ...body, deployment });
      if (Buffer.byteLength(json) > 128_000) return Response.json({ reason: 'RESPONSE_LIMIT' }, { status: 503, headers });
      headers.set('Content-Type', 'application/json');
      return new Response(json, { status, headers });
    };
    const reject = (reason: string, status = 400) => reply({ schemaVersion: 'afterclose-live-gateway/v1', status: 'LIVE_EVIDENCE_UNAVAILABLE', reason }, status);
    if (request.headers.get('Origin') !== PRODUCTION_ORIGIN) return reject('ORIGIN_NOT_ALLOWED', 403);
    headers.set('Access-Control-Allow-Origin', PRODUCTION_ORIGIN);
    if (options.region() !== 'eu-central-1') return reject('HOST_REGION_UNVERIFIED', 503);
    if (request.method !== 'GET') { headers.set('Allow', 'GET'); return reject('METHOD_NOT_ALLOWED', 405); }
    if (request.headers.has('Authorization') || request.headers.has('Content-Type')) return reject('UNEXPECTED_HEADERS');
    const url = new URL(request.url);
    const query = [...url.searchParams];
    if (query.length > 1 || query.some(([k, v]) => k !== 'forceFunctionRegion' || v !== 'eu-central-1')) return reject('INVALID_REQUEST');
    const path = url.pathname.replace(/^\/functions\/v1(?=\/)/, '');
    if (path === '/live-evidence/health') return reply({ serviceAvailable: true });
    if (path === '/live-evidence/diagnostics') return reject('DIAGNOSTICS_DISABLED', 404);
    if (path === '/live-evidence') {
      if (!captured || clock() - captured.at >= 30_000) return reply(gatewayResponse(unavailableObservation('configuration'), clock()), 503);
      headers.set('X-AfterClose-Cache', 'HIT');
      return reply(gatewayResponse(captured.observation, clock()));
    }
    if (path !== '/live-evidence/validate') return reject('INVALID_REQUEST');
    if (!options.permitDigest || !options.expiresAt || clock() >= options.expiresAt) return reject('VALIDATION_DISABLED', 404);
    const permit = request.headers.get('X-AfterClose-Validation') ?? '';
    if (permit.length !== 64 || !timingSafeEqual(createHash('sha256').update(permit).digest(), Buffer.from(options.permitDigest, 'hex'))) return reject('VALIDATION_NOT_ALLOWED', 403);
    if (started) return reject('VALIDATION_ALREADY_ATTEMPTED', 409);
    started = true;
    let probe: ResponseAudit | undefined;
    options.network?.(true);
    try {
      try { await ops.platforms(a => { probe = a; }); }
      catch {
        const reason = probe?.code === '40304' ? 'FRANKFURT_AUTH_REJECTED_40304' : probe?.code === '42900' ? 'BINANCE_RATE_LIMIT' : 'AUTHENTICATED_PROBE_FAILED';
        return reply({ reason, probe: probe ?? null, fullEvaluationAttempted: false }, 503);
      }
      if (!probe || probe.status !== 200 || probe.code !== '0') return reply({ reason: 'AUTHENTICATED_PROBE_FAILED', probe: probe ?? null, fullEvaluationAttempted: false }, 503);
      const start = performance.now();
      const observation = await observeCompetition(ops);
      const gateway = gatewayResponse(observation, clock());
      if (observation.state === 'connected') captured = { observation, at: clock() };
      return reply({ reason: 'FRANKFURT_BINANCE_AUTHENTICATION_VERIFIED', probe, fullEvaluationAttempted: true, evaluationLatencyMs: performance.now() - start, gateway });
    } catch { return reply({ reason: 'VALIDATION_FAILED', probe: probe ?? null, fullEvaluationAttempted: true }, 503); }
    finally { options.network?.(false); }
  };
}
