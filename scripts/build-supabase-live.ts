// Isolated server bundle. Never imports an environment file or embeds credentials.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

async function main() {
  const out = '.tools/supabase-live';
  await mkdir(out, { recursive: true });
  const source = `import process from 'node:process';import {Buffer} from 'node:buffer';
import {createSupabaseLive} from '../../gateway/supabase-live';
import {createSupabaseTransport} from '../../gateway/supabase-transport';
import {observeCompetition} from '../../src/lib/competition/observe';
// Supabase disallows setEnv. Supply only the adapter's required values through
// a private read-only process facade; never mutate or enumerate Deno's env.
globalThis.process=Object.create(process,{env:{value:Object.freeze({AFTERCLOSE_DEPLOYMENT_MODE:'competition-live',BINANCE_API_KEY:Deno.env.get('BINANCE_API_KEY'),BINANCE_SECRET_KEY:Deno.env.get('BINANCE_SECRET_KEY')})}});globalThis.Buffer=Buffer;
const region=()=>Deno.env.get('SB_REGION');
const transport=createSupabaseTransport(globalThis.fetch.bind(globalThis),region);
globalThis.fetch=transport.fetch;
let lastCaptureCalls=0;
const handler=createSupabaseLive({region,retryAfterMs:transport.retryAfterMs,observe:async ops=>{const before=transport.binanceCalls();try{return await observeCompetition(ops);}finally{lastCaptureCalls=transport.binanceCalls()-before;}}});
Deno.serve(async request=>{const response=await handler(request);const cache=response.headers.get('X-AfterClose-Cache');const calls=cache==='MISS'?lastCaptureCalls:0;response.headers.set('X-AfterClose-Provider-Calls',String(calls));if(cache)console.info(JSON.stringify({event:'afterclose-request',status:response.status,cache,binanceCalls:calls,region:region()==='eu-central-1'?'eu-central-1':'unverified'}));return response;});`;
  const entry = out + '/entry.ts'; await writeFile(entry, source);
  const options = { entryPoints: [entry], bundle: true, platform: 'node' as const, target: 'es2022', format: 'esm' as const, conditions: ['react-server'], minify: true, metafile: true, write: false };
  const probe = await build(options), inputs = Object.keys(probe.metafile!.inputs).sort();
  if (inputs.some(p => /^(src\/(app|components|demo)|static-preview|docs)\//.test(p) || /node_modules\/(next|react|react-dom)\//.test(p) || /\.env/.test(p))) throw Error('Unsafe bundle input');
  const hash = createHash('sha256'); for (const p of inputs) hash.update(p).update((await readFile(p, 'utf8')).replaceAll('\r\n', '\n'));
  const identity = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sourceDigest: hash.digest('hex'), dirty: !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim() };
  const result = await build({ ...options, plugins: [{ name: 'identity', setup(b) { b.onLoad({ filter: /gateway[\\/]build-info\.ts$/ }, () => ({ contents: `export const GATEWAY_BUILD=${JSON.stringify(identity)};`, loader: 'ts' })); } }] });
  await writeFile(out + '/index.ts', result.outputFiles![0].contents);
  const report = { identity, bytes: result.outputFiles![0].contents.length, inputs, sourceMaps: false };
  await writeFile(out + '/build.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, inputs: inputs.length }));
}
main().catch(() => { console.error('Supabase live build failed; no environment files loaded.'); process.exitCode = 1; });
