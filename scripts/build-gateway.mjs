// Prebuilt, isolated deployment package. Does not load environment files or run code.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const out='.tools/gateway-package';
await mkdir(`${out}/functions`,{recursive:true});
await mkdir(`${out}/lib`,{recursive:true});
await mkdir(`${out}/public`,{recursive:true});
const options={entryPoints:['gateway/handler.ts'],bundle:true,platform:'node',target:'node24',format:'esm',conditions:['react-server'],minify:true,metafile:true,write:false};
const probe=await build(options);
const inputs=Object.keys(probe.metafile.inputs).sort();
if(inputs.some(p=>/^(static-preview|docs|src\/app|src\/components)\//.test(p)||/node_modules\/(next|react|react-dom)\//.test(p)))throw Error('Unexpected function dependency');
const hash=createHash('sha256');
hash.update((await readFile('gateway/function.ts','utf8')).replaceAll('\r\n','\n'));
for(const path of inputs)hash.update(path+'\n').update((await readFile(path,'utf8')).replaceAll('\r\n','\n'));
const identity={commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),sourceDigest:hash.digest('hex'),dirty:!!execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()};
const result=await build({...options,plugins:[{name:'build-identity',setup(b){b.onLoad({filter:/gateway[\\/]build-info\.ts$/},()=>({contents:`export const GATEWAY_BUILD=${JSON.stringify(identity)};`,loader:'ts'}));}}]});
await writeFile(`${out}/lib/evidence.mjs`,result.outputFiles[0].contents);
// Preserve a literal, statically discoverable Netlify config outside minified code.
await writeFile(`${out}/functions/live-evidence.mjs`,(await readFile('gateway/function.ts','utf8')).replace('"./handler"','"../lib/evidence.mjs"'));
const bundleBytes=(await stat(`${out}/lib/evidence.mjs`)).size+(await stat(`${out}/functions/live-evidence.mjs`)).size;
await writeFile(`${out}/public/index.html`,'<!doctype html><meta charset="utf-8"><title>AfterClose evidence gateway</title><p>Read-only evidence gateway. Use the AfterClose judging frontend.</p>');
await writeFile(`${out}/netlify.toml`,'[build]\n  publish = "public"\n  functions = "functions"\n[functions]\n  node_bundler = "esbuild"\n');
await writeFile('.tools/gateway-build.json',JSON.stringify({identity,bytes:bundleBytes,inputs:['gateway/function.ts',...inputs],externalImports:result.metafile.outputs['<stdout>']?.imports??Object.values(result.metafile.outputs)[0].imports,sourceMaps:false},null,2));
console.log(JSON.stringify({gatewayBytes:bundleBytes,inputCount:inputs.length+1,identity}));
