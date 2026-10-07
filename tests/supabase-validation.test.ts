import assert from 'node:assert/strict';
import test from 'node:test';
import {createSupabaseValidation,TARGET_REGION} from '../gateway/supabase-validation';
import {PRODUCTION_ORIGIN} from '../gateway/handler';
import {createEvidenceReceipt} from '../src/lib/competition/receipt';
import {unavailableObservation} from '../src/lib/competition/unavailable';
const base='https://example.invalid/functions/v1/live-evidence';
const request=(suffix='',init:RequestInit={})=>new Request(base+suffix,{...init,headers:{Origin:PRODUCTION_ORIGIN,...init.headers}});
test('Gate A fails closed in missing, unknown, and prohibited regions without any fetch',async()=>{
  for(const region of [undefined,'us-east-1','eu-west-2','unknown']){
    let calls=0;const handler=createSupabaseValidation({region:()=>region,runtime:'test',fetch:async()=>{calls++;throw Error();}});
    for(const suffix of ['', '/diagnostics']){const r=await handler(request(suffix));assert.equal(r.status,503);assert.equal((await r.json()).reason,'HOST_REGION_UNVERIFIED');}assert.equal(calls,0);
  }
});
test('Gate A returns the exact canonical unavailable receipt with zero outbound calls',async()=>{
  let calls=0;const at=1791374400000;
  const handler=createSupabaseValidation({region:()=>TARGET_REGION,runtime:'test',clock:()=>at,fetch:async()=>{calls++;throw Error();}});
  const r=await handler(request('?forceFunctionRegion=eu-central-1'));const b=await r.json();const expected=createEvidenceReceipt(unavailableObservation(),at);
  assert.equal(r.status,503);assert.deepEqual(b.receipt,expected.receipt);assert.equal(b.receiptDigest,expected.digest);assert.equal(calls,0);
});
test('strict origins, methods, paths, queries and headers reject before diagnostics',async()=>{
  let calls=0;const handler=createSupabaseValidation({region:()=>TARGET_REGION,runtime:'test',diagnosticUntil:Date.now()+10000,fetch:async()=>{calls++;throw Error();}});
  for(const Origin of ['https://evil.invalid','https://afterclose-preview.pages.dev.evil.invalid','*']){const r=await handler(request('',{headers:{Origin}}));assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);}
  for(const method of ['POST','PUT','DELETE','OPTIONS'])assert.equal((await handler(request('',{method}))).status,405);
  for(const suffix of ['?asset=BTC','?contract=0x123','?chain=1','?url=https://evil.invalid','?endpoint=price','?forceFunctionRegion=us-east-1','?forceFunctionRegion=eu-central-1&forceFunctionRegion=eu-central-1','/other'])assert.equal((await handler(request(suffix))).status,400);
  for(const headers of [{Authorization:'rejected'},{'Content-Type':'application/json'}])assert.equal((await handler(request('',{headers}))).status,400);
  assert.equal(calls,0);
});
test('diagnostic permits only two fixed secret-free requests and coalesces repeats',async()=>{
  const seen:string[]=[];const handler=createSupabaseValidation({region:()=>TARGET_REGION,runtime:'test',clock:()=>1,diagnosticUntil:10,fetch:async(url,init)=>{seen.push(String(url));assert.equal(init?.redirect,'error');assert.deepEqual(init?.headers,{Accept:'application/json'});return Response.json({ip:'203.0.113.1',country_code:'DE',secret:'NEVER_RETURN'});}});
  const responses=await Promise.all([handler(request('/diagnostics')),handler(request('/diagnostics'))]);for(const r of responses)assert.ok(!(await r.text()).includes('NEVER_RETURN'));assert.deepEqual(seen,['https://ipwho.is/','https://ipapi.co/json/']);
});
test('diagnostics disabled by default and after expiry',async()=>{
  for(const diagnosticUntil of [undefined,1]){const h=createSupabaseValidation({region:()=>TARGET_REGION,runtime:'test',clock:()=>2,diagnosticUntil});assert.equal((await h(request('/diagnostics'))).status,404);}
});
