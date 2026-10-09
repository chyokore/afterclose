// Read-only static deployment parity and public gateway health. No provider capture.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const origin=process.argv[2];
if(!['https://live-staging.afterclose-preview.pages.dev','https://afterclose-preview.pages.dev'].includes(origin))throw Error('Unknown deployment origin');
const release=JSON.parse(await readFile('.tools/public-live-release/dist/release.json','utf8'));
const results=[];
for(const [path,hash] of Object.entries(release.files)){
 if(path==='_headers')continue; // Cloudflare consumes this configuration rather than serving it.
 const response=await fetch(origin+'/'+path);
 if(new URL(response.url).origin!==origin)throw Error('Unexpected asset origin');
 const actual=createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
 results.push({path,status:response.status,sha256Matches:actual===hash});
}
const main=await fetch(origin+'/');const csp=main.headers.get('content-security-policy');
const health=await fetch('https://wakuqrnxjwikvlrxgezg.supabase.co/functions/v1/live-evidence/health?forceFunctionRegion=eu-central-1',{headers:{Origin:origin}});
const body=await health.json();
const report={at:new Date().toISOString(),origin,commit:release.commit,files:results,csp,health:{status:health.status,cors:health.headers.get('access-control-allow-origin'),body}};
await mkdir('.tools/public-live-release/checks',{recursive:true});await writeFile('.tools/public-live-release/checks/'+(origin.includes('live-staging')?'staging':'production')+'.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
if(results.some(x=>x.status!==200||!x.sha256Matches)||health.status!==200||health.headers.get('access-control-allow-origin')!==origin||!csp?.includes('connect-src https://wakuqrnxjwikvlrxgezg.supabase.co'))process.exitCode=1;
