// Explicit local rehearsal: credentials loaded only into this process, never logged.
import { loadEnvConfig } from '@next/env';
import { mkdir,writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { createGateway,PRODUCTION_ORIGIN } from '../gateway/handler';
import { withMetrics } from '../src/lib/metrics';
import { createEvidenceReceipt } from '../src/lib/competition/receipt';
import type { GatewayResponse } from '../gateway/contract';
async function main(){
loadEnvConfig(process.cwd(),false,{info(){},error(){}});
process.env.AFTERCLOSE_DEPLOYMENT_MODE='competition-live';
delete process.env.AFTERCLOSE_PREVIEW_MODE;
const handler=createGateway();
const fetchOriginal=globalThis.fetch;
let binanceCalls=0,issuerCalls=0;
globalThis.fetch=async(input,init)=>{const u=new URL(String(input));if(u.hostname==='web3.binance.com')binanceCalls++;else if(u.hostname==='app.ondo.finance')issuerCalls++;return fetchOriginal(input,init);};
const samples:Record<string,unknown>[]=[];
await mkdir('.tools/gateway-rehearsal',{recursive:true});
for(let index=0;index<5;index++){
  if(index)await delay(31_000);
  const metrics:Record<string,number>={};binanceCalls=0;issuerCalls=0;
  const cpu=process.cpuUsage(),start=performance.now();
  const response=await withMetrics(metrics,()=>handler(new Request('http://localhost/api/live-evidence',{headers:{Origin:PRODUCTION_ORIGIN}})));
  const text=await response.text(),wallMs=performance.now()-start,usage=process.cpuUsage(cpu);
  const body=JSON.parse(text) as GatewayResponse;
  const equivalent=!!body.receipt&&createEvidenceReceipt(body.receipt.observation,body.receipt.evaluatedAtMs,body.receipt.calendarReview).digest===body.receiptDigest;
  const sample={index,status:response.status,wallMs,cpuMs:(usage.user+usage.system)/1000,...metrics,binanceCalls,issuerCalls,responseBytes:Buffer.byteLength(text),evidence:body.receipt?.evidenceStatus,freshness:body.receipt?.freshness.status,decision:body.receipt?.engine.result.decision,equivalent};
  samples.push(sample);
  await writeFile(`.tools/gateway-rehearsal/response-${index}.json`,text);
  const before=binanceCalls;
  const cached=await handler(new Request('http://localhost/api/live-evidence',{headers:{Origin:PRODUCTION_ORIGIN}}));
  const cachedBody=await cached.json() as GatewayResponse;
  if(binanceCalls!==before||JSON.stringify(cachedBody.receipt.observation)!==JSON.stringify(body.receipt.observation))throw Error('Cache verification failed');
  console.log(JSON.stringify(sample));
}
const fields=['wallMs','cpuMs','binanceHeadersMs','binanceBodyReadMs','jsonParsingMs','engineMs','receiptMs','canonicalJsonMs','sha256Ms','responseSerializationMs','responseBytes'];
const distributions=Object.fromEntries(fields.map(key=>{const values=samples.map(s=>Number((s as Record<string,unknown>)[key]??0)).sort((a,b)=>a-b);return[key,{median:values[2],p90:values[4],max:values[4]}];}));
await writeFile('.tools/gateway-rehearsal/benchmark.json',JSON.stringify({at:new Date().toISOString(),samples,distributions,notes:'Five local uncached evaluations, 31 seconds apart; p90 nearest-rank equals maximum at n=5. Network durations sum concurrent requests, not critical-path wall time. Receipt timing includes engine and SHA; timings overlap. CPU is process CPU, not Netlify billing.'},null,2));
console.log(JSON.stringify({distributions}));
}
main().catch(()=>{console.error('Gateway benchmark failed; inspect sanitized local results.');process.exitCode=1;});
