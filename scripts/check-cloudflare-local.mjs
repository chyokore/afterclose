// Local-only check of a prepared ignored experiment; never authenticates or deploys.
import { spawn } from 'node:child_process';
import { resolve,join,dirname,delimiter } from 'node:path';
import { writeFileSync, readdirSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
const stage=resolve('.tools/cloudflare-feasibility');
const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH','PATHEXT','COMSPEC'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
env.PATH=dirname(process.execPath)+delimiter+(env.PATH??'');
Object.assign(env,{CI:'1',NEXT_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:'false',XDG_CONFIG_HOME:join(stage,'isolated-user-config'),AFTERCLOSE_PREVIEW_MODE:'synthetic'});
const p=spawn(process.execPath,[join(stage,'node_modules/wrangler/bin/wrangler.js'),'dev','--local','--ip','127.0.0.1','--port','3188','--inspector-port','9239'],{cwd:stage,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
let log=''; for(const s of [p.stdout,p.stderr])s.on('data',d=>{log+=d;process.stdout.write(d);});
try {
 for(let i=0;i<120&&!log.includes('Ready on')&&p.exitCode===null;i++) await new Promise(r=>setTimeout(r,500));
 assert.match(log,/Ready on/);
 const scenarios=['missing-independent','stale-token','closed-stale-reference','missing-multiplier','stale-reference','fresh-evidence','missing-timestamp','provider-disagreement','insufficient-liquidity','high-slippage','market-closed','api-unavailable'];
 const paths=['/','/demo',...scenarios.map(s=>'/demo?scenario='+s),'/demo?scenario=invalid','/?mode=live','/?AFTERCLOSE_PREVIEW_MODE=live','/?mode=%00live','/demo?scenario=fresh-evidence&mode=live','/demo?scenario=../../live','/demo?scenario=%00','/demo?scenario=live&scenario=fresh-evidence','/unknown','/live','/demo/live','/api/live'];
 for(const path of paths) for(const rsc of [false,true]) {
   const r=await fetch('http://127.0.0.1:3188'+path,{headers:{Connection:'close','x-afterclose-preview-mode':'live','AFTERCLOSE_PREVIEW_MODE':'live',Cookie:'AFTERCLOSE_PREVIEW_MODE=live',...(rsc?{RSC:'1'}:{})}});
   assert.equal(r.status,['/unknown','/live','/demo/live','/api/live'].includes(path)?404:200);
   if(rsc && r.status===200) assert.match(r.headers.get('content-type')??'', /text\/x-component/); const text=await r.text(); assert.match(text,/SYNTHETIC (DEMO|SCENARIO)/); assert.doesNotMatch(text,/Historical discovery|NVDAon|1\.0017152487959898/); assert.equal(r.headers.get('x-rehearsal-external-fetches'),'0');
 }
 const page=await (await fetch('http://127.0.0.1:3188/',{headers:{Connection:'close'}})).text();
 assert.match(page,/<title>AfterClose \| Synthetic demo<\/title>/);
 const assets=[...new Set([...page.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g)].map(m=>m[1]))];
 assert.ok(assets.length>0);
 for(const asset of assets){const r=await fetch('http://127.0.0.1:3188'+asset,{headers:{Connection:'close'}});assert.equal(r.status,200);assert.doesNotMatch(await r.text(),/Historical discovery|1\.0017152487959898|BINANCE_SECRET_KEY/);}
 console.log(`PASS workerd metadata and ${assets.length} static assets`);
 assert.doesNotMatch(log,/AFTERCLOSE_EXTERNAL_FETCH_BLOCKED/);
 console.log(`PASS workerd: ${paths.length*2} route/HTML/RSC requests; external provider fetches 0`);
 const files=[];function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const file=join(dir,e.name);if(e.isDirectory())walk(file);else files.push({file,bytes:statSync(file).size});}}
 walk(join(stage,'.open-next'));
 console.log(JSON.stringify({generatedFiles:files.length,generatedBytes:files.reduce((n,f)=>n+f.bytes,0),note:'Raw adapter output, not final Worker bundle size or hosted CPU evidence'}));
} finally {
 writeFileSync(join(stage,'runtime.log'),log);
 if(p.exitCode===null) await new Promise(r=>{p.once('exit',r);p.kill();});
}
