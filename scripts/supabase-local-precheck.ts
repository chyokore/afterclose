// One request only; never prints credentials, signed URL, headers or provider payload.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {rwaGet,type ResponseAudit} from '../src/lib/binance/client';
import {platformSchema} from '../src/lib/binance/schemas';
async function main(){
  const nextEnv=createRequire(import.meta.url)('@next/env') as {loadEnvConfig:(cwd:string)=>unknown};
  nextEnv.loadEnvConfig(process.cwd());
  let audit:ResponseAudit|undefined;
  let pass=false;
  try{await rwaGet('platforms',{},platformSchema,a=>{audit=a;});pass=audit?.status===200&&audit?.code==='0';}catch{/* Safe audit only. */}
  const result={pass,localRequests:1,endpoint:'platforms',audit:audit??null,checkedAt:new Date().toISOString(),tlsVerification:true};
  await mkdir('.tools/supabase-gate-b',{recursive:true});
  await writeFile('.tools/supabase-gate-b/local-precheck.json',JSON.stringify(result,null,2));
  console.log(JSON.stringify(result));if(!pass)process.exitCode=1;
}
main().catch(()=>{console.error('Local precheck setup failed; no secret output.');process.exitCode=1;});
