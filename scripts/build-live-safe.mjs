import assert from 'node:assert/strict';
import { cpSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

// Build from allowlisted source files and an allowlisted environment. Do not read,
// copy, rename or pass the owner's .env.local or provider credentials to the builder.
const root=realpathSync(process.cwd());
assert.ok(existsSync(join(root,'src/lib/competition/receipt.ts')),'Run from AfterClose root');
mkdirSync(join(root,'.tools'),{recursive:true});
const stage=mkdtempSync(join(root,'.tools','competition-build-'));
for(const item of ['src','package.json','package-lock.json','tsconfig.json','next.config.ts','postcss.config.mjs'])cpSync(join(root,item),join(stage,item),{recursive:true});
if(existsSync(join(root,'public')))cpSync(join(root,'public'),join(stage,'public'),{recursive:true});
const {readFileSync}=await import('node:fs');
const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',windowsHide:true}).trim();
assert.match(commit,/^[a-f0-9]{40}$/);
const dirty=Boolean(execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:root,encoding:'utf8',windowsHide:true}).trim());
const hash=createHash('sha256');
function hashTree(path,prefix=''){for(const name of readdirSync(path).sort()){const p=join(path,name),key=prefix+name;if(statSync(p).isDirectory())hashTree(p,key+'/');else if(key!=='lib/build-info.ts'){hash.update(key+'\0');hash.update(readFileSync(p,'utf8').replaceAll('\r\n','\n'));}}}
hashTree(join(stage,'src'));
for(const name of ['package.json','package-lock.json','next.config.ts','postcss.config.mjs','tsconfig.json'])hash.update(name+'\0'+readFileSync(join(stage,name),'utf8').replaceAll('\r\n','\n'));
const buildInfo={commit,dirty,sourceDigest:hash.digest('hex')};
writeFileSync(join(stage,'src/lib/build-info.ts'),`export const BUILD_INFO = ${JSON.stringify(buildInfo)} as const;\n`);
function linkDependencies(from,to){
  mkdirSync(to,{recursive:true});
  for(const entry of readdirSync(from,{withFileTypes:true})){
    if(entry.name==='.bin')continue; // Linux npm executable symlinks are not build inputs; invoke Node entry points directly.
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
assert.equal(readFileSync(audit,'utf8'),'','Build attempted provider fetch');
// Replace only the generated .next directory inside this verified workspace.
const output=resolve(root,'.next');
assert.equal(output,join(root,'.next'));
assert.ok(output.startsWith(root+sep));
if(existsSync(output)){assert.ok(!lstatSync(output).isSymbolicLink());assert.equal(realpathSync(output),output);rmSync(output,{recursive:true,force:true});}
cpSync(join(stage,'.next'),output,{recursive:true});
writeFileSync(join(root,'.tools','last-safe-build.json'),JSON.stringify({stage,output,buildInfo}));
console.log(JSON.stringify({isolatedBuild:'passed',environmentFilesCopied:0,providerFetchAttempts:0,stage,output,buildInfo}));
