import { gatewayResponse, PRODUCTION_ORIGIN } from './handler';
import { unavailableObservation } from '../src/lib/competition/unavailable';
import { GATEWAY_BUILD } from './build-info';

export const TARGET_REGION = 'eu-central-1';
export const FUNCTION_PATH = '/live-evidence';
export const GEO_ENDPOINTS = ['https://ipwho.is/', 'https://ipapi.co/json/'] as const;
type Options = {
  region: () => string | undefined;
  runtime: string;
  clock?: () => number;
  diagnosticUntil?: number;
  fetch?: typeof fetch;
  selfTest?: () => Promise<unknown>;
};

// Gate A is deliberately incapable of observing Binance, regardless of env settings.
// This adapter must be reviewed and changed separately for Gate B.
export function createSupabaseValidation(options: Options) {
  const clock = options.clock ?? Date.now;
  const outbound = options.fetch ?? globalThis.fetch;
  let diagnostic: Promise<unknown> | undefined;
  let windowStart = 0, requests = 0;
  return async (request: Request): Promise<Response> => {
    const headers = new Headers({'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','X-Content-Type-Options':'nosniff'});
    const region = options.region();
    const deployment = {provider:'Supabase',intendedRegion:TARGET_REGION,runtimeRegion:region === TARGET_REGION ? region : 'unverified',runtime:options.runtime,gate:'A',providerAccess:'DISABLED',build:GATEWAY_BUILD};
    const reply = (body: object, status: number) => Response.json({...body,deployment},{status,headers});
    const reject = (reason: string, status = 400) => reply({schemaVersion:'afterclose-live-gateway/v1',status:'LIVE_EVIDENCE_UNAVAILABLE',reason},status);
    if(request.headers.get('Origin') !== PRODUCTION_ORIGIN) return reject('ORIGIN_NOT_ALLOWED',403);
    headers.set('Access-Control-Allow-Origin',PRODUCTION_ORIGIN);
    if(region !== TARGET_REGION) return reject('HOST_REGION_UNVERIFIED',503);
    if(request.method !== 'GET'){headers.set('Allow','GET');return reject('METHOD_NOT_ALLOWED',405);}
    if(request.headers.has('Authorization') || request.headers.has('Content-Type')) return reject('UNEXPECTED_HEADERS');
    const url = new URL(request.url);
    const query = [...url.searchParams];
    if(query.some(([k,v])=>k!=='forceFunctionRegion'||v!==TARGET_REGION)||query.length>1) return reject('INVALID_REQUEST');
    const path = url.pathname.replace(/^\/functions\/v1(?=\/)/,'');
    if(path !== FUNCTION_PATH && path !== `${FUNCTION_PATH}/diagnostics`) return reject('INVALID_REQUEST');
    const now=clock();
    if(now-windowStart>=60_000||now<windowStart){windowStart=now;requests=0;}
    if(++requests>120) return reject('INSTANCE_RATE_LIMIT',429);
    if(path.endsWith('/diagnostics')) {
      if(!options.diagnosticUntil || now>options.diagnosticUntil) return reject('DIAGNOSTICS_DISABLED',404);
      diagnostic ??= (async()=>{
        const probes=[];
        for(const endpoint of GEO_ENDPOINTS){
          const start=performance.now();
          try{
            const r=await outbound(endpoint,{redirect:'error',signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});
            const text=await r.text();
            if(!r.ok||text.length>16000) throw Error('diagnostic failed');
            const b=JSON.parse(text);
            const string=(v:unknown)=>typeof v==='string'?v.slice(0,160):typeof v==='number'?String(v):null;
            probes.push({source:endpoint,status:r.status,ip:string(b.ip),country:string(b.country_code),region:string(b.region),city:string(b.city),asn:string(b.connection?.asn??b.asn),provider:string(b.connection?.org??b.org),elapsedMs:performance.now()-start});
          }catch{probes.push({source:endpoint,status:'UNAVAILABLE',elapsedMs:performance.now()-start});}
        }
        return {label:'CREDENTIAL_FREE_RUNTIME_VALIDATION_NOT_MARKET_EVIDENCE',observedAtMs:clock(),probes,selfTest:await options.selfTest?.()};
      })();
      try{return reply({schemaVersion:'afterclose-gate-a-diagnostics/v1',status:'LIVE_EVIDENCE_UNAVAILABLE',diagnostics:await diagnostic},200);}
      catch{return reject('RUNTIME_VALIDATION_FAILED',503);}
    }
    try{return reply(gatewayResponse(unavailableObservation('configuration'),now),503);}
    catch{return reject('EVIDENCE_UNAVAILABLE',503);}
  };
}
