// Public, credential-free requests only. Never load environment files or call Binance.
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const endpoint='https://wakuqrnxjwikvlrxgezg.supabase.co/functions/v1/live-evidence';
const origin='https://afterclose-preview.pages.dev';
const results=[];
async function call(label,{suffix='',method='GET',Origin=origin}={}){
  const url=new URL(endpoint+suffix);url.searchParams.append('forceFunctionRegion','eu-central-1');
  const start=performance.now();const r=await fetch(url,{method,headers:{Origin},redirect:'error',signal:AbortSignal.timeout(30000)});
  const text=await r.text();let body;try{body=JSON.parse(text);}catch{body={invalidJson:true};}
  const row={label,status:r.status,elapsedMs:performance.now()-start,cors:r.headers.get('access-control-allow-origin'),region:r.headers.get('x-sb-edge-region'),body};results.push(row);return row;
}
try{
  const first=await call('first');assert.equal(first.status,503);assert.equal(first.body.reason,'configuration');assert.equal(first.body.deployment.runtimeRegion,'eu-central-1');assert.equal(first.body.receipt.engine.result.decision,'WAIT');
  const warm=await call('warm');assert.equal(warm.status,503);assert.equal(warm.cors,origin);
  for(const Origin of ['https://evil.invalid','https://afterclose-preview.pages.dev.evil.invalid']){const r=await call('denied-origin',{Origin});assert.equal(r.status,403);assert.equal(r.cors,null);}
  for(const method of ['POST','PUT','DELETE'])assert.equal((await call(method,{method})).status,405);
  for(const suffix of ['?asset=BTC','?contract=0x123','?chain=1','?url=https://example.invalid','?endpoint=price'])assert.equal((await call('rejected-input',{suffix})).status,400);
  if(process.argv.includes('--diagnostics')){
    const diagnostic=await call('egress-diagnostic',{suffix:'/diagnostics'});assert.equal(diagnostic.status,200);
    const expected=JSON.parse(await readFile('.tools/supabase-validation/expected.json','utf8'));
    assert.deepEqual(diagnostic.body.diagnostics.selfTest,expected);assert.ok(Object.values(expected.checks).every(Boolean));
  }
  console.log(JSON.stringify({checks:'PASS',requests:results.length,summary:results.map(({label,status,elapsedMs,cors,region})=>({label,status,elapsedMs,cors,region})),diagnostic:results.find(r=>r.label==='egress-diagnostic')?.body.diagnostics.probes}));
}catch{console.error('Gate A verification failed; inspect sanitized saved results.');process.exitCode=1;}
finally{await writeFile('.tools/supabase-validation/hosted-results.json',JSON.stringify({at:new Date().toISOString(),results},null,2));}
