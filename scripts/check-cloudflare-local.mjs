// Local-only check of a prepared ignored experiment; never authenticates or deploys.
import { spawn } from 'node:child_process';
import { resolve,join,dirname,delimiter } from 'node:path';
import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import assert from 'node:assert/strict';
import InspectorSocket from 'ws';
const stage=resolve('.tools/cloudflare-migration');
const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH','PATHEXT','COMSPEC'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
env.PATH=dirname(process.execPath)+delimiter+(env.PATH??'');
Object.assign(env,{CI:'1',NEXT_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:'false',XDG_CONFIG_HOME:join(stage,'isolated-user-config'),AFTERCLOSE_PREVIEW_MODE:'synthetic'});
const config=JSON.parse(readFileSync(join(stage,'wrangler.json'),'utf8'));
config.main='cloudflare/rehearsal-worker.mjs';
const mode=process.argv[2]??'synthetic';
assert.ok(['synthetic','missing','live','synthetic '].includes(mode),'Unsupported rehearsal mode');
config.vars=mode==='missing'?{}:{AFTERCLOSE_PREVIEW_MODE:mode};
writeFileSync(join(stage,'wrangler.rehearsal.json'),JSON.stringify(config));
const timings=[];
const p=spawn(process.execPath,[join(stage,'node_modules/wrangler/bin/wrangler.js'),'dev','--config','wrangler.rehearsal.json','--local','--ip','127.0.0.1','--port','3188','--inspector-port','9239'],{cwd:stage,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
let log=''; for(const s of [p.stdout,p.stderr])s.on('data',d=>{log+=d;process.stdout.write(d);});
try {
 for(let i=0;i<120&&!log.includes('Ready on')&&p.exitCode===null;i++) await new Promise(r=>setTimeout(r,500));
 assert.match(log,/Ready on/);
 if(mode!=='synthetic') {
  const assetFile=readdirSync(join(stage,'.open-next/assets/_next/static/chunks')).find(f=>f.endsWith('.js'));
  assert.ok(assetFile);
  for(const path of ['/','/demo','/_next/static/chunks/'+assetFile,'/unknown']) for(const method of ['GET','POST']) {
    const r=await fetch('http://127.0.0.1:3188'+path+'?AFTERCLOSE_PREVIEW_MODE=synthetic',{method,headers:{Connection:'close',AFTERCLOSE_PREVIEW_MODE:'synthetic',Cookie:'AFTERCLOSE_PREVIEW_MODE=synthetic'},...(method==='POST'?{body:'AFTERCLOSE_PREVIEW_MODE=synthetic'}:{})});
    assert.equal(r.status,503);assert.equal(r.headers.get('x-rehearsal-external-fetches'),'0');assert.equal(await r.text(),'Synthetic preview configuration required.');
  }
  console.log('PASS '+mode+': 8 rejected configuration-override requests; zero app fetches');
 } else {
 const scenarios=['missing-independent','stale-token','closed-stale-reference','missing-multiplier','stale-reference','fresh-evidence','missing-timestamp','provider-disagreement','insufficient-liquidity','high-slippage','market-closed','api-unavailable'];
 const paths=['/','/demo',...scenarios.map(s=>'/demo?scenario='+s),'/demo?scenario=invalid','/?mode=live','/?AFTERCLOSE_PREVIEW_MODE=live','/?mode=%00live','/demo?scenario=fresh-evidence&mode=live','/demo?scenario=../../live','/demo?scenario=%00','/demo?scenario=live&scenario=fresh-evidence','/unknown','/live','/demo/live','/api/live'];
 for(const path of paths) for(const rsc of [false,true]) {
   const start=performance.now(); const r=await fetch('http://127.0.0.1:3188'+path,{headers:{Connection:'close','x-afterclose-preview-mode':'live','AFTERCLOSE_PREVIEW_MODE':'live',Cookie:'AFTERCLOSE_PREVIEW_MODE=live',...(rsc?{RSC:'1'}:{})}});
   assert.equal(r.status,['/unknown','/live','/demo/live','/api/live'].includes(path)?404:200);
   if(rsc && r.status===200) assert.match(r.headers.get('content-type')??'', /text\/x-component/); const text=await r.text(); assert.match(text,/SYNTHETIC (DEMO|SCENARIO)/); assert.doesNotMatch(text,/Historical discovery|NVDAon|1\.0017152487959898/); assert.equal(r.headers.get('x-rehearsal-external-fetches'),'0');timings.push({path,rsc,wallMs:Math.round(performance.now()-start)});
 }
 for(let i=0;i<3;i++) for(const rsc of [false,true]) {
 const r=await fetch('http://127.0.0.1:3188/',{headers:{Connection:'close','User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',...(rsc?{RSC:'1'}:{})}});assert.equal(r.status,200);assert.match(await r.text(),/SYNTHETIC DEMO/);assert.equal(r.headers.get('x-rehearsal-external-fetches'),'0');
 }
 console.log('PASS 6 mobile-user-agent HTML/RSC refresh requests');
 for(const path of ['/','/demo']) {
 const r=await fetch('http://127.0.0.1:3188'+path,{method:'POST',body:'AFTERCLOSE_PREVIEW_MODE=live',headers:{Connection:'close','Content-Type':'application/x-www-form-urlencoded'}});assert.ok([200,405].includes(r.status));const body=await r.text();assert.doesNotMatch(body,/Historical discovery|NVDAon/);assert.equal(r.headers.get('x-rehearsal-external-fetches'),'0');
 }
 console.log('PASS 2 body override requests');
 // Inspector samples are diagnostic only, not Cloudflare billing CPU measurements.
 try {
  const targets=await (await fetch('http://127.0.0.1:9239/json/list')).json();
  const ws=new InspectorSocket(targets[0].webSocketDebuggerUrl,{origin:'http://localhost:9239'});
  await new Promise((ok,fail)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',fail,{once:true});});
  let id=0;const pending=new Map();
  ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const done=pending.get(m.id);pending.delete(m.id);if(done)done(m);}});
  async function cdp(method,params={}){const n=++id;const result=await new Promise((ok,fail)=>{const timer=setTimeout(()=>{pending.delete(n);fail(new Error('Inspector timeout'));},10000);pending.set(n,m=>{clearTimeout(timer);if(m.error)fail(new Error(JSON.stringify(m.error)));else ok(m.result);});ws.send(JSON.stringify({id:n,method,params}));});return result;}
  try {
   await cdp('Profiler.enable');await cdp('Profiler.start');
   for(const path of ['/','/demo?scenario=fresh-evidence','/demo?scenario=provider-disagreement']){const r=await fetch('http://127.0.0.1:3188'+path,{headers:{Connection:'close'}});assert.equal(r.status,200);await r.text();assert.equal(r.headers.get('x-rehearsal-external-fetches'),'0');}
   const {profile}=await cdp('Profiler.stop');writeFileSync(join(stage,'cpu-profile.json'),JSON.stringify(profile));
   const nodes=new Map(profile.nodes.map(n=>[n.id,n.callFrame.functionName]));let activeUs=0;for(let i=0;i<(profile.samples??[]).length;i++)if(!['(idle)','(program)'].includes(nodes.get(profile.samples[i])))activeUs+=(profile.timeDeltas??[])[i]??0;
   console.log(JSON.stringify({profileRequests:3,sampledActiveMs:activeUs/1000,profileWallMs:(profile.endTime-profile.startTime)/1000,note:'Inspector sampling includes framework and GC, not hosted CPU accounting'}));
  } finally {ws.close();}
 } catch(error){console.log('CPU profile unavailable: '+error.message);}
 const page=await (await fetch('http://127.0.0.1:3188/',{headers:{Connection:'close'}})).text();
 assert.match(page,/<title>AfterClose \| Synthetic demo<\/title>/);
 assert.match(page,/name="robots" content="noindex, nofollow"/);
 assert.match(page,/name="viewport"/);
 const assets=[...new Set([...page.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g)].map(m=>m[1]))];
 assert.ok(assets.length>0);
 for(const asset of assets){const r=await fetch('http://127.0.0.1:3188'+asset,{headers:{Connection:'close'}});assert.equal(r.status,200);assert.doesNotMatch(await r.text(),/Historical discovery|1\.0017152487959898|BINANCE_SECRET_KEY/);}
 console.log(`PASS workerd metadata and ${assets.length} static assets`);
 assert.doesNotMatch(log,/AFTERCLOSE_EXTERNAL_FETCH_BLOCKED/);
 console.log(`PASS workerd: ${paths.length*2} route/HTML/RSC requests; external provider fetches 0`);
 const files=[];function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const file=join(dir,e.name);if(e.isDirectory())walk(file);else files.push({file,bytes:statSync(file).size});}}
 walk(join(stage,'.open-next'));
 const tmp=join(stage,'.wrangler/tmp');
 if(existsSync(tmp))for(const e of readdirSync(tmp,{withFileTypes:true}))if(e.isDirectory()&&e.name.startsWith('dev-')){mkdirSync(join(stage,'local-bundles'),{recursive:true});cpSync(join(tmp,e.name),join(stage,'local-bundles',e.name),{recursive:true});}

 writeFileSync(join(stage,'timings.json'),JSON.stringify(timings,null,2));
 console.log(JSON.stringify({generatedFiles:files.length,generatedBytes:files.reduce((n,f)=>n+f.bytes,0),note:'Raw adapter output, not final Worker bundle size or hosted CPU evidence'}));
}
} finally {
 writeFileSync(join(stage,'runtime-'+mode+'.log'),log);
 if(p.exitCode===null) await new Promise(r=>{p.once('exit',r);p.kill();});
}
