import assert from 'node:assert/strict';
import { cpSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { spawn } from 'node:child_process';

// Build from allowlisted source files and an allowlisted environment. Do not read,
// copy, rename or pass the owner's .env.local or provider credentials to the builder.
const root=realpathSync(process.cwd());
assert.ok(existsSync(join(root,'src/lib/competition/receipt.ts')),'Run from AfterClose root');
mkdirSync(join(root,'.tools'),{recursive:true});
const stage=mkdtempSync(join(root,'.tools','competition-build-'));
for(const item of ['src','package.json','package-lock.json','tsconfig.json','next.config.ts','postcss.config.mjs'])cpSync(join(root,item),join(stage,item),{recursive:true});
if(existsSync(join(root,'public')))cpSync(join(root,'public'),join(stage,'public'),{recursive:true});
function linkDependencies(from,to){
  mkdirSync(to,{recursive:true});
  for(const entry of readdirSync(from,{withFileTypes:true})){
    const source=join(from,entry.name),target=join(to,entry.name);
    assert.ok(!lstatSync(source).isSymbolicLink(),'Dependency links require review before an isolated build');
    // Windows cloud-backed directories can have misleading Dirent attributes.
    if(statSync(source).isDirectory())linkDependencies(source,target);else linkSync(source,target);
  }
}
linkDependencies(join(root,'node_modules'),join(stage,'node_modules'));
const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH','PATHEXT','COMSPEC'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
const audit=join(stage,'network-audit.txt');writeFileSync(audit,'');
Object.assign(env,{NEXT_TELEMETRY_DISABLED:'1',AFTERCLOSE_PREVIEW_MODE:'synthetic',AFTERCLOSE_NETWORK_AUDIT:audit,NODE_OPTIONS:`--require="${resolve(root,'scripts/deny-rehearsal-network.cjs').replaceAll('\\','/')}"`});
assert.ok(!existsSync(join(stage,'.env.local')));
const child=spawn(process.execPath,[join(stage,'node_modules/next/dist/bin/next'),'build'],{cwd:stage,env,stdio:'inherit',windowsHide:true});
const code=await new Promise((ok,fail)=>{child.on('error',fail);child.on('exit',ok);});
if(code!==0)throw new Error('Isolated production build failed');
const {readFileSync}=await import('node:fs');
assert.equal(readFileSync(audit,'utf8'),'','Build attempted provider fetch');
// Replace only the generated .next directory inside this verified workspace.
const output=resolve(root,'.next');
assert.equal(output,join(root,'.next'));
assert.ok(output.startsWith(root+sep));
if(existsSync(output)){assert.ok(!lstatSync(output).isSymbolicLink());assert.equal(realpathSync(output),output);rmSync(output,{recursive:true,force:true});}
cpSync(join(stage,'.next'),output,{recursive:true});
console.log(JSON.stringify({isolatedBuild:'passed',environmentFilesCopied:0,providerFetchAttempts:0,stage,output}));
