import { statSync, cpSync, mkdirSync, readdirSync, linkSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join, dirname, delimiter } from 'node:path';
import { spawn } from 'node:child_process';
const stage=resolve('.tools/cloudflare-migration');
mkdirSync(stage,{recursive:true});
for(const item of ['src','cloudflare','package.json','package-lock.json','tsconfig.json','next.config.ts','postcss.config.mjs','open-next.config.ts','wrangler.json']) cpSync(item,join(stage,item),{recursive:true});
function links(from,to){mkdirSync(to,{recursive:true});for(const e of readdirSync(from,{withFileTypes:true})){const a=join(from,e.name),b=join(to,e.name);if(statSync(a).isDirectory())links(a,b);else {try{linkSync(a,b);}catch(err){if(err.code!=='EEXIST')throw err;}}}}
links(resolve('node_modules'),join(stage,'node_modules'));
const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH','PATHEXT','COMSPEC'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
Object.assign(env,{PATH:dirname(process.execPath)+delimiter+env.PATH,CI:'1',NEXT_TELEMETRY_DISABLED:'1',WRANGLER_SEND_METRICS:'false',CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV:'false',AFTERCLOSE_PREVIEW_MODE:'synthetic',XDG_CONFIG_HOME:join(stage,'isolated-user-config'),AFTERCLOSE_NETWORK_AUDIT:join(stage,'build-fetch-audit.log'),NODE_OPTIONS:`--require="${resolve('scripts/deny-rehearsal-network.cjs').replaceAll('\\','/')}"`});
writeFileSync(env.AFTERCLOSE_NETWORK_AUDIT,'');
const pkg=JSON.parse(readFileSync(join(stage,'node_modules/@opennextjs/cloudflare/package.json'),'utf8'));
const bin=typeof pkg.bin==='string'?pkg.bin:Object.values(pkg.bin)[0];
const p=spawn(process.execPath,[join(stage,'node_modules/@opennextjs/cloudflare',bin),'build'],{cwd:stage,env,stdio:['ignore','pipe','pipe'],windowsHide:true});
let log='';for(const stream of [p.stdout,p.stderr])stream.on('data',d=>{log+=d;process.stdout.write(d);});
p.on('exit',code=>{writeFileSync(join(stage,'build.log'),log);process.exitCode=code??1;});
