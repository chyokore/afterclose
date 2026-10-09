import { createGateway, PRODUCTION_ORIGIN } from './handler';
import { GATEWAY_BUILD } from './build-info';

// Supabase supplies a fresh closure per worker. A miss uses the canonical gateway
// capture path; correctness never depends on a preceding request reaching us.
export function createSupabaseLive(options: {
  region: () => string | undefined;
  clock?: () => number;
  observe?: NonNullable<Parameters<typeof createGateway>[0]>['observe'];
  retryAfterMs?: () => number;
}) {
  const gateway = createGateway(options);
  return async (request: Request): Promise<Response> => {
    const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' });
    const reject = (reason: string, status = 400) => Response.json({ schemaVersion: 'afterclose-live-gateway/v1', status: 'LIVE_EVIDENCE_UNAVAILABLE', reason }, { status, headers });
    if (request.headers.get('Origin') !== PRODUCTION_ORIGIN) return reject('ORIGIN_NOT_ALLOWED', 403);
    headers.set('Access-Control-Allow-Origin', PRODUCTION_ORIGIN);
    if (options.region() !== 'eu-central-1') return reject('HOST_REGION_UNVERIFIED', 503);
    headers.set('X-AfterClose-Region', 'eu-central-1');
    if (request.method !== 'GET') { headers.set('Allow', 'GET'); return reject('METHOD_NOT_ALLOWED', 405); }
    if (request.headers.has('Authorization') || request.headers.has('Content-Type')) return reject('UNEXPECTED_HEADERS');
    const url = new URL(request.url), query = [...url.searchParams];
    if (query.length > 1 || query.some(([k, v]) => k !== 'forceFunctionRegion' || v !== 'eu-central-1')) return reject('INVALID_REQUEST');
    const path = url.pathname.replace(/^\/functions\/v1(?=\/)/, '');
    if (path === '/live-evidence/health') return Response.json({ serviceAvailable: true, deploymentMode: 'competition-live', runtimeRegion: 'eu-central-1', build: GATEWAY_BUILD }, { headers });
    if (path === '/live-evidence/diagnostics' || path === '/live-evidence/validate') return reject('DIAGNOSTICS_DISABLED', 404);
    if (path !== '/live-evidence') return reject('INVALID_REQUEST');
    const response = await gateway(new Request('https://gateway.internal/api/live-evidence', { headers: request.headers }));
    response.headers.set('X-AfterClose-Region', 'eu-central-1');
    return response;
  };
}
