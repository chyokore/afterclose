import assert from 'node:assert/strict';
import test from 'node:test';
import {readFile} from 'node:fs/promises';
import {createGateway,gatewayResponse,originAllowed,PRODUCTION_ORIGIN} from '../gateway/handler';
import {createEvidenceReceipt,canonicalize,verifyReceipt} from '../src/lib/competition/receipt';
import {unavailableObservation} from '../src/lib/competition/unavailable';
import {endpointOrder,type LiveObservation} from '../src/lib/competition/model';
import {mvpContract} from '../src/lib/binance/schemas';
import {withMetrics} from '../src/lib/metrics';
import type {GatewayResponse} from '../gateway/contract';
const at=Date.parse('2026-10-07T12:00:00Z');
function fixture():LiveObservation{
  const identity={binanceChainId:'56' as const,platformId:'ondo',tokenContractAddress:mvpContract};
  return {mode:'live',state:'connected',failure:null,discovery:'MATCH',searchCompany:'Nvidia Corp',
    token:{...identity,assetType:1,tokenSymbol:'NVDAon',tokenName:'NVIDIA (Ondo)',underlyingName:'NVIDIA',underlyingTicker:'NVDA',decimals:'18',tokenToShareRatio:'1.01'},
    quote:{...identity,tokenPrice:'240.123456789',tokenPriceUpdatedAt:at-1000,referencePrice:'237'},market:{...identity,marketData:{referencePrice:'237'},statusInfo:{marketStatus:'OPEN',openState:true}},chains:[{binanceChainId:'56',name:'BSC'}],
    audits:endpointOrder.map(endpoint=>({endpoint,status:200,code:'0',observedAtMs:at-100,latencyMs:10,responseTimestamp:at-200})),issuer:unavailableObservation().issuer};
}
async function configured(run:()=>Promise<void>){
  const keys=['BINANCE_API_KEY','BINANCE_SECRET_KEY','BINANCE_WEB3_BASE_URL','AFTERCLOSE_DEPLOYMENT_MODE','AFTERCLOSE_PREVIEW_MODE','NODE_ENV','NETLIFY'];const before=keys.map(k=>process.env[k]);const fetch=globalThis.fetch;
  try{for(const key of keys)delete process.env[key];process.env.BINANCE_API_KEY='test-only-key';process.env.BINANCE_SECRET_KEY='test-only-secret';process.env.AFTERCLOSE_DEPLOYMENT_MODE='competition-live';Object.assign(process.env,{NODE_ENV:'production'});await run();}
  finally{globalThis.fetch=fetch;keys.forEach((k,i)=>{if(before[i]===undefined)delete process.env[k];else process.env[k]=before[i];});}
}
const request=(path='/api/live-evidence',origin:string|null=PRODUCTION_ORIGIN,method='GET')=>new Request('https://gateway.example'+path,{method,headers:origin?{Origin:origin}:{}});
test('gateway receipt is byte-equivalent to full application for identical evidence and evaluation',()=>{
  for(const observation of [fixture(),unavailableObservation(),{...fixture(),quote:{...fixture().quote!,tokenPriceUpdatedAt:at-86400001}}]){
    const metrics:Record<string,number>={};const gateway=withMetrics(metrics,()=>gatewayResponse(observation,at));const full=createEvidenceReceipt(observation,at);
    assert.equal(gateway.receiptDigest,full.digest);assert.equal(canonicalize(gateway.receipt),full.canonicalJson);assert.equal(verifyReceipt({receipt:gateway.receipt,canonicalJson:canonicalize(gateway.receipt),digest:gateway.receiptDigest})?.digest,full.digest);assert.ok(metrics.engineMs>=0);assert.ok(metrics.sha256Ms>=0);
  }
});
test('gateway CORS exact production and explicit local origins only',()=>{
  for(const origin of [null,'null','https://evil.example','https://afterclose-preview.pages.dev.evil.example','http://127.0.0.1:4173','https://preview--afterclose.netlify.app'])assert.equal(originAllowed(origin,{NODE_ENV:'production'}),false);
  assert.equal(originAllowed(PRODUCTION_ORIGIN,{NODE_ENV:'production'}),true);
  for(const origin of ['http://localhost:4173','http://127.0.0.1:4173']){assert.equal(originAllowed(origin,{NODE_ENV:'development'}),true);assert.equal(originAllowed(origin,{NODE_ENV:'development',NETLIFY:'true'}),false);}
  assert.equal(originAllowed('http://localhost:4174',{NODE_ENV:'development'}),false);
});
test('gateway rejects alternate paths, queries, methods and origins before capture',()=>configured(async()=>{
  let captures=0;const handler=createGateway({observe:async()=>{captures++;return fixture();}});
  for(const path of ['/','/.netlify/functions/live-evidence','/api/live-evidence/','/api/live-evidence?asset=NVDA','/api/live-evidence?url=https://evil.example'])assert.equal((await handler(request(path))).status,400);
  for(const method of ['POST','PUT','DELETE','OPTIONS','HEAD'])assert.equal((await handler(request(undefined,undefined,method))).status,405);
  for(const origin of [null,'null','https://evil.example','http://localhost:4173']){const r=await handler(request(undefined,origin));assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);}
  for(const header of ['Authorization','Content-Type']){const r=request();r.headers.set(header,'test');assert.equal((await handler(r)).status,400);}
  assert.equal(captures,0);
}));
test('gateway missing, malformed, conflicting or absent configuration fails closed without provider calls',()=>configured(async()=>{
  let captures=0;const handler=createGateway({observe:async()=>{captures++;return fixture();}});
  for(const [name,value] of [['BINANCE_API_KEY',undefined],['BINANCE_SECRET_KEY','bad\nvalue'],['AFTERCLOSE_DEPLOYMENT_MODE',undefined],['AFTERCLOSE_DEPLOYMENT_MODE','synthetic'],['AFTERCLOSE_PREVIEW_MODE','synthetic']] as const){const old=process.env[name];if(value===undefined)delete process.env[name];else process.env[name]=value;const response=await handler(request());const body=await response.json() as GatewayResponse;assert.equal(response.status,503);assert.equal(body.status,'LIVE_EVIDENCE_UNAVAILABLE');assert.equal(body.receipt.observation.quote,null);assert.equal(body.receipt.engine.result.decision,'WAIT');if(old===undefined)delete process.env[name];else process.env[name]=old;}
  assert.equal(captures,0);
}));
test('30 second cache re-evaluates age without changing observation or provider clocks',()=>configured(async()=>{
  let now=at,captures=0;const handler=createGateway({clock:()=>now,observe:async()=>{captures++;return fixture();}});
  const first=await (await handler(request())).json() as GatewayResponse;now+=29000;const next=await (await handler(request())).json() as GatewayResponse;
  assert.equal(captures,1);assert.deepEqual(next.receipt.observation,first.receipt.observation);assert.notEqual(next.receiptDigest,first.receiptDigest);assert.equal(next.receipt.fields[0].observationAgeMs,29100);assert.equal(next.receipt.evaluatedAtMs,now);now+=1000;await handler(request());assert.equal(captures,2);
}));
test('concurrent requests coalesce and 121st request is locally throttled',()=>configured(async()=>{
  let captures=0;const handler=createGateway({clock:()=>at,observe:async()=>{captures++;await new Promise(r=>setTimeout(r,5));return fixture();}});
  const responses=await Promise.all(Array.from({length:120},()=>handler(request())));assert.ok(responses.every(r=>r.status===200));assert.equal(captures,1);const limited=await handler(request());assert.equal(limited.status,429);assert.equal(limited.headers.get('Retry-After'),'60');assert.equal(captures,1);
}));
test('provider errors get sixty second cooldown with safe errors and no historical fallback',()=>configured(async()=>{
  let now=at,captures=0;const handler=createGateway({clock:()=>now,observe:async()=>{captures++;throw Error('PRIVATE_TEST_TRANSPORT_VALUE');}});
  for(const offset of [0,1000,59999]){now=at+offset;const response=await handler(request());assert.equal(response.status,503);const text=await response.text();assert.ok(!text.includes('PRIVATE_TEST_TRANSPORT_VALUE'));assert.equal(JSON.parse(text).receipt.observation.quote,null);}
  assert.equal(captures,1);now=at+60000;await handler(request());assert.equal(captures,2);
}));
test('reflected credentials and oversized receipts are blocked',()=>configured(async()=>{
  const reflected=fixture();reflected.token!.tokenName=process.env.BINANCE_API_KEY!;const response=await createGateway({clock:()=>at,observe:async()=>reflected})(request());assert.equal(response.status,503);assert.ok(!(await response.text()).includes(process.env.BINANCE_API_KEY!));
  const large=fixture();large.token!.tokenName='x'.repeat(130000);assert.equal((await createGateway({clock:()=>at,observe:async()=>large})(request())).status,503);
}));
test('metadata refresh schedule reduces calls and preserves original transport audits',()=>configured(async()=>{
  const realNow=Date.now;let now=at;Date.now=()=>now;const f=fixture();const calls:string[]=[];
  try{globalThis.fetch=async(input)=>{const url=new URL(String(input));if(url.hostname==='app.ondo.finance')return new Response('',{status:503});const name=url.pathname.split('/').at(-1)!;calls.push(name);const data:Record<string,unknown>={platforms:[{platformId:'ondo',chainDistribution:[{binanceChainId:'56',tokenCount:1}]}],tokens:[f.token],search:[{ticker:'NVDA',companyName:'Nvidia Corp',assets:[f.token]}],chain:f.chains,price:[{...f.quote,tokenPriceUpdatedAt:now-1000}],'underlying-market':f.market};return Response.json({code:0,success:true,timestamp:now,data:data[name]});};
    const handler=createGateway({clock:()=>now});const cold=await (await handler(request())).json() as GatewayResponse;assert.equal(calls.length,6);assert.equal(cold.receipt.evidenceStatus,'PARTIAL');
    now+=31000;calls.length=0;const warm=await (await handler(request())).json() as GatewayResponse;assert.deepEqual(calls.sort(),['price','underlying-market']);assert.equal(warm.receipt.observation.audits.find(a=>a.endpoint==='tokens')?.observedAtMs,at);assert.equal(warm.receipt.observation.audits.find(a=>a.endpoint==='price')?.observedAtMs,now);
    now=at+300000;calls.length=0;await handler(request());assert.equal(calls.length,4);assert.ok(!calls.includes('platforms'));assert.ok(!calls.includes('chain'));
    now=at+3600000;calls.length=0;await handler(request());assert.equal(calls.length,6);
  }finally{Date.now=realNow;}
}));
for(const failure of ['unauthorized','timeout','schema','reflected'] as const)test(`gateway adapter failure ${failure} is sanitized and never returns a live price`,()=>configured(async()=>{
  globalThis.fetch=async()=>{if(failure==='timeout')throw new DOMException('PRIVATE_TIMEOUT','TimeoutError');if(failure==='unauthorized')return new Response('PRIVATE_AUTH',{status:401});if(failure==='reflected')return Response.json({code:0,data:process.env.BINANCE_SECRET_KEY});return new Response('{bad json');};
  const response=await createGateway()(request());assert.equal(response.status,503);const text=await response.text();assert.ok(!text.includes('PRIVATE_'));assert.ok(!text.includes(process.env.BINANCE_SECRET_KEY!));const body=JSON.parse(text) as GatewayResponse;assert.equal(body.receipt.observation.quote,null);assert.equal(body.receipt.engine.result.decision,'WAIT');
}));
test('production bundle excludes UI, filesystem snapshots and environment files',async()=>{
  const report=JSON.parse(await readFile('.tools/gateway-build.json','utf8')) as {inputs:string[];bytes:number;externalImports:{path:string}[]};
  assert.ok(report.bytes<600000);assert.ok(report.inputs.every(p=>!/(src\/app|src\/components|src\/demo|static-preview|docs\/|node_modules\/(next|react)|snapshot\.ts|\.env)/.test(p)));assert.ok(report.externalImports.every(i=>['node:crypto','node:async_hooks'].includes(i.path)));
});
