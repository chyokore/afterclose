import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {canonicalJson,createLiveSession,verifyDigest,GATEWAY_URL} from '../public-live/session';
import {STAGING_ORIGIN,createSupabaseLive} from '../gateway/supabase-live';
import {canonicalize} from '../src/lib/competition/receipt';
const envelope=JSON.parse(readFileSync('docs/deployment/supabase-cache-repair-first-receipt.json','utf8'));
const body={schemaVersion:'afterclose-live-gateway/v1',status:'LIVE_EVIDENCE',receipt:envelope.receipt,receiptDigest:envelope.digest};
function storage(){const data=new Map<string,string>();return {getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};}
test('browser digest matches canonical server JSON; modified receipt is rejected',async()=>{assert.equal(canonicalJson(envelope.receipt),canonicalize(envelope.receipt));await verifyDigest(body as never);const changed=structuredClone(body);changed.receipt.evaluatedAtMs++;await assert.rejects(verifyDigest(changed as never));});
test('manual-only requests coalesce and navigation/remount respects session cooldown',async()=>{
 let calls=0,now=1;let release!:(r:Response)=>void;const store=storage();
 const request:typeof fetch=async(url,init)=>{calls++;assert.equal(url,GATEWAY_URL);assert.equal(init?.credentials,'omit');assert.equal(init?.redirect,'error');assert.equal(init?.headers,undefined);return new Promise(r=>{release=r;});};
 const session=createLiveSession(store,request,()=>now);assert.equal(calls,0);
 const a=session.refresh(),b=session.refresh();assert.equal(a,b);assert.equal(session.loading(),true);release(Response.json(body));await a;assert.equal(calls,1);
 await assert.rejects(createLiveSession(store,request,()=>now).refresh());assert.equal(calls,1);now+=45001;assert.equal(session.remainingMs(),0);
});
test('Retry-After survives remount; failures do not substitute receipts or retry',async()=>{
 for(const retry of ['120',new Date(121000).toUTCString()]){let calls=0;const store=storage();const request:typeof fetch=async()=>{calls++;return new Response(null,{status:429,headers:{'Retry-After':retry}});};const session=createLiveSession(store,request,()=>1000);await assert.rejects(session.refresh(),/TEMPORARILY UNAVAILABLE/);assert.equal(calls,1);assert.ok(createLiveSession(store,request,()=>1000).remainingMs()>=120000);}
});
test('bad digest and wrong schema fail closed',async()=>{for(const bad of [{...body,receiptDigest:'0'.repeat(64)},{...body,schemaVersion:'wrong'}])await assert.rejects(createLiveSession(storage(),async()=>Response.json(bad)).refresh(),/TEMPORARILY UNAVAILABLE/);});
test('exact staging origin authorized without wildcard or privileged browser key',async()=>{
 const handler=createSupabaseLive({region:()=> 'eu-central-1'});
 const r=await handler(new Request('https://example.invalid/functions/v1/live-evidence/health',{headers:{Origin:STAGING_ORIGIN}}));assert.equal(r.status,200);assert.equal(r.headers.get('Access-Control-Allow-Origin'),STAGING_ORIGIN);
 for(const origin of ['https://other.afterclose-preview.pages.dev',STAGING_ORIGIN+'.evil.invalid','*'])assert.equal((await handler(new Request('https://example.invalid/functions/v1/live-evidence',{headers:{Origin:origin}}))).status,403);
});
