import { observeCompetition } from "../src/lib/competition/observe";
import { createEvidenceReceipt } from "../src/lib/competition/receipt";
import { unavailableObservation } from "../src/lib/competition/unavailable";
import { credentialsConfigured } from "../src/lib/binance/client";
import { deploymentConfiguration } from "../src/lib/deployment";
import { containsCredentialValue } from "../src/lib/secret-boundary";
import { evidenceCache } from "../src/lib/competition/cache";
import { measure } from "../src/lib/metrics";
import { cachedOperations } from "./metadata-cache";
import { GATEWAY_BUILD } from "./build-info";
import type { GatewayResponse } from "./contract";

export const PRODUCTION_ORIGIN="https://afterclose-preview.pages.dev";
export const LOCAL_ORIGINS=["http://127.0.0.1:4173","http://localhost:4173"];
export function originAllowed(origin:string|null,env:NodeJS.ProcessEnv=process.env){
  return origin===PRODUCTION_ORIGIN || env.NODE_ENV==="development" && !env.NETLIFY && LOCAL_ORIGINS.includes(origin??"");
}
export function gatewayResponse(observation:Parameters<typeof createEvidenceReceipt>[0],now:number):GatewayResponse {
  const envelope=measure("receiptMs",()=>createEvidenceReceipt(observation,now));
  const r=envelope.receipt;
  return {schemaVersion:"afterclose-live-gateway/v1",status:r.evidenceStatus==="UNAVAILABLE"?"LIVE_EVIDENCE_UNAVAILABLE":"LIVE_EVIDENCE",reason:r.observation.failure,
    cache:{scope:"per-instance",successCooldownMs:30000,failureCooldownMs:60000,metadataDiscoveryTtlMs:300000,platformsChainsTtlMs:3600000},
    receipt:r,receiptDigest:envelope.digest,build:GATEWAY_BUILD};
}
export function createGateway(options:{clock?:()=>number;observe?:typeof observeCompetition;retryAfterMs?:()=>number}={}) {
  const clock=options.clock??Date.now;
  const ops=cachedOperations(undefined,clock);
  const capture=()=> (options.observe??observeCompetition)(ops).catch(()=>unavailableObservation("provider"));
  const load=evidenceCache(capture,o=>o.state!=="connected",clock,()=>options.retryAfterMs?.()??60_000);
  let windowStart=0,requests=0;
  return async function handler(request:Request):Promise<Response>{
    const headers=new Headers({"Cache-Control":"no-store","Vary":"Origin","X-Content-Type-Options":"nosniff","Content-Type":"application/json"});
    const reject=(status:number,reason:string)=>Response.json({schemaVersion:"afterclose-live-gateway/v1",status:"LIVE_EVIDENCE_UNAVAILABLE",reason},{status,headers});
    if(!originAllowed(request.headers.get("Origin")))return reject(403,"ORIGIN_NOT_ALLOWED");
    headers.set("Access-Control-Allow-Origin",request.headers.get("Origin")!);
    const url=new URL(request.url);
    if(url.pathname!=="/api/live-evidence"||url.search)return reject(400,"INVALID_REQUEST");
    // Simple GET requires no preflight. All other methods, including OPTIONS, fail.
    if(request.method!=="GET"){headers.set("Allow","GET");return reject(405,"METHOD_NOT_ALLOWED");}
    if(request.headers.has("Authorization")||request.headers.has("Content-Type"))return reject(400,"UNEXPECTED_HEADERS");
    const now=clock();if(now-windowStart>=60_000||now<windowStart){windowStart=now;requests=0;}
    if(++requests>120){headers.set("Retry-After","60");return reject(429,"INSTANCE_RATE_LIMIT");}
    const configured=process.env.AFTERCLOSE_DEPLOYMENT_MODE==="competition-live" && deploymentConfiguration().liveAllowed && credentialsConfigured();
    try {
      const observation=configured?await load(read=>{
        headers.set('X-AfterClose-Cache',read.state);
        if(read.retryAfterMs>0)headers.set('Retry-After',String(Math.ceil(read.retryAfterMs/1000)));
      }):unavailableObservation("configuration");
      const body=gatewayResponse(observation,clock());
      if(containsCredentialValue(body))return reject(503,"UNSAFE_PROVIDER_RESPONSE");
      const json=measure("responseSerializationMs",()=>JSON.stringify(body));
      if(Buffer.byteLength(json)>128_000)return reject(503,"RESPONSE_LIMIT");
      return new Response(json,{status:body.status==="LIVE_EVIDENCE_UNAVAILABLE"?503:200,headers});
    }catch{return reject(503,"EVIDENCE_UNAVAILABLE");}
  };
}
export default createGateway();
