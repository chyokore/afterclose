// Offline sizing only. Never loads .env, contacts a provider, or emits mock evidence.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
import {createGateway,PRODUCTION_ORIGIN} from '../gateway/handler';
import {withMetrics} from '../src/lib/metrics';
import {liveObservationSchema} from '../src/lib/competition/model';
import {createEvidenceReceipt} from '../src/lib/competition/receipt';

async function main(){
const fixture=JSON.parse(await readFile('tests/fixtures/binance-rwa.json','utf8'));
const originalFetch=globalThis.fetch;
const names=['BINANCE_API_KEY','BINANCE_SECRET_KEY','AFTERCLOSE_DEPLOYMENT_MODE','AFTERCLOSE_PREVIEW_MODE','BINANCE_WEB3_BASE_URL','NODE_ENV'] as const;
const prior=names.map(k=>process.env[k]);
names.forEach(k=>delete process.env[k]);
Object.assign(process.env,{BINANCE_API_KEY:'test-only-key',BINANCE_SECRET_KEY:'test-only-secret',AFTERCLOSE_DEPLOYMENT_MODE:'competition-live',NODE_ENV:'production'});
const stats=(v:number[])=>{const a=[...v].sort((a,b)=>a-b);return {median:a[Math.ceil(a.length*.5)-1],p90:a[Math.ceil(a.length*.9)-1],max:a.at(-1)};};
const results:Record<string,unknown>={mode:'OFFLINE SYNTHETIC SIZING ONLY',node:process.version,providerCalls:0,batches:30,requestsPerBatch:10};
let fakeWait=0,requestCount=0,catalog=fixture.tokens;
globalThis.fetch=async input=>{
  const u=new URL(String(input));
  if(fakeWait)await delay(fakeWait);
  if(u.hostname==='app.ondo.finance')return new Response('',{status:503});
  assert.equal(u.hostname,'web3.binance.com','Unexpected host: no network fallback');
  requestCount++;
  const endpoint=u.pathname.split('/').at(-1)!;
  const payload:Record<string,unknown>={platforms:fixture.platforms,tokens:catalog,search:fixture.search,price:fixture.price.map((p:object)=>({...p,tokenPriceUpdatedAt:Date.now()-1000})),'underlying-market':fixture.market,chain:[{binanceChainId:'56',name:'BSC'}]};
  assert.ok(endpoint in payload,'Unexpected endpoint: no network fallback');
  return Response.json({code:0,success:true,data:payload[endpoint],timestamp:Date.now()});
};
async function sample(){
  const m:Record<string,number>={},cpu=process.cpuUsage(),start=performance.now();
  const response=await withMetrics(m,()=>createGateway()(new Request('https://offline.invalid/api/live-evidence',{headers:{Origin:PRODUCTION_ORIGIN}})));
  const text=await response.text(),usage=process.cpuUsage(cpu),wallMs=performance.now()-start;
  const b=JSON.parse(text);
  assert.equal(response.status,200);assert.equal(b.receipt.discovery,'MATCH');
  assert.equal(createEvidenceReceipt(b.receipt.observation,b.receipt.evaluatedAtMs,b.receipt.calendarReview).digest,b.receiptDigest);
  // Isolated schema micro-measurement is outside total CPU/wall sample.
  const normStart=performance.now();liveObservationSchema.parse(b.receipt.observation);const normalizationSchemaMs=performance.now()-normStart;
  return {wallMs,cpuMs:(usage.user+usage.system)/1000,normalizationSchemaMs,...m,responseBytes:Buffer.byteLength(text)};
}
try{
  results.firstRequest=await sample();
  for(const [label,size]of [['small-fixture',fixture.tokens.length],['expanded-catalog',500]] as const){
    catalog=[...fixture.tokens];
    while(catalog.length<size)catalog.push({...fixture.tokens[0],tokenSymbol:`BENCH${catalog.length}`,underlyingTicker:`BENCH${catalog.length}`});
    for(let i=0;i<15;i++)await sample();
    const samples:Record<string,number>[]=[],individual:Record<string,number>[]=[];
    for(let b=0;b<30;b++){
      const rows:Record<string,number>[]=[];for(let i=0;i<10;i++)rows.push(await sample());
      individual.push(...rows);
      const keys=Object.keys(rows[0]);samples.push(Object.fromEntries(keys.map(k=>[k,rows.reduce((n,r)=>n+Number((r as Record<string,number>)[k]??0),0)/rows.length])));
    }
    results[label]={catalogEntries:size,providerPayloadBytes:Buffer.byteLength(JSON.stringify(catalog)),distributions:Object.fromEntries(Object.keys(samples[0]).map(k=>[k,stats(samples.map(s=>s[k]))])),individualDistributions:Object.fromEntries(Object.keys(individual[0]).map(k=>[k,stats(individual.map(s=>s[k]))])),samples};
  }
  catalog=fixture.tokens;fakeWait=50;results.simulatedNetworkSample=await sample();
  results.mockBinanceRequests=requestCount;
  results.notes=['No actual network; fake credentials only. Historical small fixture plus explicitly synthetic 500-entry sizing case.','Warm distributions are 30 batch means of 10 requests, reducing Windows process-CPU quantization; maxima are batch means, not individual-request maxima.','Total CPU excludes verifier and isolated schema probe; includes mock response construction and Node request/stream machinery. It is a local process CPU proxy, not workerd billed CPU.','Receipt timing contains engine/canonical JSON/SHA metrics; do not sum overlapping metrics. Schema probe isolates normalization only, not full receipt assembly.','Issuer response is an offline 503, so successful issuer HTML parsing and real TLS/DNS are excluded. Full network timings remain the historical five-live-sample record.','Simulated 50ms wait per mock fetch produces two sequential provider stages; sum of concurrent fetch metrics is not elapsed network time.'];
  await mkdir('.tools/non-us-hosting',{recursive:true});
  await writeFile('.tools/non-us-hosting/gateway-cpu.json',JSON.stringify(results,null,2));
  console.log(JSON.stringify({...results,'small-fixture':{...(results['small-fixture'] as object),samples:undefined},'expanded-catalog':{...(results['expanded-catalog'] as object),samples:undefined}},null,2));
}finally{globalThis.fetch=originalFetch;const env:Record<string,string|undefined>=process.env;names.forEach((k,i)=>{if(prior[i]===undefined)delete env[k];else env[k]=prior[i];});}
}
main().catch(()=>{console.error('Offline benchmark validation failed; no network fallback.');process.exitCode=1;});
