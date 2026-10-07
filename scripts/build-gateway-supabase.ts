// Credential-free, standalone Gate A build. Never reads environment files.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DEMO_NOW, syntheticFixture } from '../src/demo/reference-fixtures';
import { runtimeSelfTest } from '../gateway/supabase-self-test';

async function main(){
  const out='.tools/supabase-validation';await mkdir(out,{recursive:true});
  const engineCases=(['stale-reference','market-closed','fresh-evidence','api-unavailable'] as const).map(name=>({name,input:syntheticFixture(name),at:DEMO_NOW}));
  // Only fixed test vectors are embedded in the temporary diagnostic, not Scenario Lab.
  const diagnosticUntil=process.argv.includes('--diagnostics')?Date.now()+2*3600_000:0;
  const source=`import process from 'node:process';import {Buffer} from 'node:buffer';
import {createSupabaseValidation} from '../../gateway/supabase-validation';
import {runtimeSelfTest} from '../../gateway/supabase-self-test';
globalThis.process=process;globalThis.Buffer=Buffer;
const allowed=new Set(['https://ipwho.is/','https://ipapi.co/json/']);
const transport=globalThis.fetch.bind(globalThis);
globalThis.fetch=(input,init)=>{const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;if(!allowed.has(url))throw Error('GATE_A_NETWORK_DENIED');return transport(input,init);};
const handler=createSupabaseValidation({region:()=>Deno.env.get('SB_REGION'),runtime:'Supabase Edge Runtime / Deno '+Deno.version.deno,diagnosticUntil:${diagnosticUntil},selfTest:()=>runtimeSelfTest(${JSON.stringify(engineCases)})});
Deno.serve(handler);`;
  const entry=out+'/entry.ts';await writeFile(entry,source);
  const options={entryPoints:[entry],bundle:true,platform:'node' as const,target:'es2022',format:'esm' as const,conditions:['react-server'],minify:true,metafile:true,write:false};
  const probe=await build(options),inputs=Object.keys(probe.metafile!.inputs).sort();
  if(inputs.some(p=>/^(src\/(app|components|demo)|static-preview|docs)\//.test(p)||/node_modules\/(next|react|react-dom)\//.test(p)||/\.env/.test(p)))throw Error('Unsafe bundle input');
  const hash=createHash('sha256');for(const p of inputs)hash.update(p).update((await readFile(p,'utf8')).replaceAll('\r\n','\n'));
  const identity={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDigest:hash.digest('hex'),dirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()};
  const result=await build({...options,plugins:[{name:'identity',setup(b){b.onLoad({filter:/gateway[\\/]build-info\.ts$/},()=>({contents:`export const GATEWAY_BUILD=${JSON.stringify(identity)};`,loader:'ts'}));}}]});
  await writeFile(out+'/index.ts',result.outputFiles[0].contents);
  await writeFile(out+'/expected.json',JSON.stringify(await runtimeSelfTest(engineCases),null,2));
  const report={identity,diagnosticUntil,bytes:result.outputFiles[0].contents.length,inputs,externalImports:Object.values(result.metafile!.outputs)[0].imports,sourceMaps:false};
  await writeFile(out+'/build.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,inputs:inputs.length}));
}
main().catch(()=>{console.error('Gate A build failed. No environment files loaded.');process.exitCode=1;});
