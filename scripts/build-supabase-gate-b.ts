// Isolated server bundle. Never imports an environment file or embeds credentials.
import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';

async function main() {
  const out = '.tools/supabase-gate-b';
  await mkdir(out, { recursive: true });
  const armed = process.argv.includes('--armed');
  const permit = armed ? randomBytes(32).toString('hex') : '';
  const permitDigest = armed ? createHash('sha256').update(permit).digest('hex') : '';
  const expiresAt = armed ? Date.now() + 3600_000 : 0;
  // Only the local invocation script consumes this control capability; it is
  // unrelated to the Binance pair and never appears in URLs or console output.
  if (armed) await writeFile(out + '/permit.json', JSON.stringify({ permit, expiresAt }));
  const source = `import process from 'node:process';import {Buffer} from 'node:buffer';
import {createSupabaseGateB} from '../../gateway/supabase-gate-b';
globalThis.process=process;globalThis.Buffer=Buffer;
process.env.AFTERCLOSE_DEPLOYMENT_MODE='competition-live';
for(const name of ['BINANCE_API_KEY','BINANCE_SECRET_KEY']){const v=Deno.env.get(name);if(v)process.env[name]=v;}
let active=false;const seen=new Set();const transport=globalThis.fetch.bind(globalThis);
globalThis.fetch=(input,init)=>{
 const url=new URL(typeof input==='string'?input:input instanceof URL?input.href:input.url);
 const paths=['/build/api/v1/dex/market/rwa/platforms','/build/api/v1/dex/market/rwa/tokens','/build/api/v1/dex/market/rwa/search','/build/api/v1/dex/market/rwa/price','/build/api/v1/dex/market/rwa/underlying-market','/build/api/v1/dex/aggregator/supported/chain'];
 const binance=url.origin==='https://web3.binance.com'&&paths.includes(url.pathname);
 const issuer=url.href==='https://app.ondo.finance/assets/nvdaon';
 if(!active||(!binance&&!issuer)||seen.has(url.origin+url.pathname)||init?.redirect!=='error')throw Error('GATE_B_NETWORK_DENIED');
 seen.add(url.origin+url.pathname);return transport(input,init);
};
Deno.serve(createSupabaseGateB({region:()=>Deno.env.get('SB_REGION'),permitDigest:${JSON.stringify(permitDigest)},expiresAt:${expiresAt},network:v=>{active=v;}}));`;
  const entry = out + '/entry.ts'; await writeFile(entry, source);
  const options = { entryPoints: [entry], bundle: true, platform: 'node' as const, target: 'es2022', format: 'esm' as const, conditions: ['react-server'], minify: true, metafile: true, write: false };
  const probe = await build(options), inputs = Object.keys(probe.metafile!.inputs).sort();
  if (inputs.some(p => /^(src\/(app|components|demo)|static-preview|docs)\//.test(p) || /node_modules\/(next|react|react-dom)\//.test(p) || /\.env/.test(p))) throw Error('Unsafe bundle input');
  const hash = createHash('sha256'); for (const p of inputs) hash.update(p).update((await readFile(p, 'utf8')).replaceAll('\r\n', '\n'));
  const identity = { commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), sourceDigest: hash.digest('hex'), dirty: !!execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim() };
  const result = await build({ ...options, plugins: [{ name: 'identity', setup(b) { b.onLoad({ filter: /gateway[\\/]build-info\.ts$/ }, () => ({ contents: `export const GATEWAY_BUILD=${JSON.stringify(identity)};`, loader: 'ts' })); } }] });
  await writeFile(out + '/index.ts', result.outputFiles![0].contents);
  const report = { identity, armed, expiresAt, bytes: result.outputFiles![0].contents.length, inputs, sourceMaps: false };
  await writeFile(out + '/build.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, inputs: inputs.length }));
}
main().catch(() => { console.error('Gate B build failed; no environment files loaded.'); process.exitCode = 1; });
