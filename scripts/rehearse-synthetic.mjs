import { statSync, cpSync, mkdirSync, readdirSync, linkSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
const root = process.cwd();
// Avoid reusing sockets that Next closes during long Windows rehearsals.
const localFetch = (url, init = {}) => fetch(url, { ...init, headers:{ ...init.headers, Connection:'close' } });
const stage = join(root, '.tools', `synthetic-rehearsal-${Date.now()}`);
mkdirSync(stage, { recursive: true });
for (const item of ['src', 'package.json', 'package-lock.json', 'tsconfig.json', 'next.config.ts', 'postcss.config.mjs']) cpSync(join(root,item), join(stage,item), { recursive: true });
function linkTree(from, to) {
  mkdirSync(to, { recursive:true });
  for (const entry of readdirSync(from, { withFileTypes:true })) {
    const source=join(from,entry.name), target=join(to,entry.name);
    if(statSync(source).isDirectory()) linkTree(source,target);
    else linkSync(source,target);
  }
}
linkTree(join(root,'node_modules'), join(stage,'node_modules'));
const audit = join(stage, 'network-audit.txt'); writeFileSync(audit, '');
// Allowlisted environment: no inherited provider credentials, NODE_OPTIONS or .env files.
const env = Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH','PATHEXT','COMSPEC'].filter(k => process.env[k]).map(k => [k,process.env[k]]));
Object.assign(env, { AFTERCLOSE_PREVIEW_MODE:'synthetic', NEXT_TELEMETRY_DISABLED:'1', AFTERCLOSE_NETWORK_AUDIT:audit, NODE_OPTIONS:`--require="${resolve('scripts/deny-rehearsal-network.cjs').replaceAll('\\', '/')}"` });
const next = join(stage, 'node_modules/next/dist/bin/next');
async function run(args) {
  const child = spawn(process.execPath, [next,...args], { cwd:stage, env, stdio:'inherit', windowsHide:true });
  await new Promise((ok,fail) => { child.on('error',fail); child.on('exit', code => code === 0 ? ok() : fail(new Error(`Exit ${code}`))); });
}
await run(['build']);
const port = 3187;
async function check(mode, invalid=false) {
  const child = spawn(process.execPath, [next,'start','--hostname','127.0.0.1','--port',String(port)], { cwd:stage, env:{...env, AFTERCLOSE_PREVIEW_MODE:mode}, stdio:['ignore','pipe','pipe'], windowsHide:true });
  let logs=''; child.stdout.on('data',d=>logs+=d); child.stderr.on('data',d=>logs+=d);
  try {
    for (let i=0;i<120 && !logs.includes('Ready');i++) await new Promise(r=>setTimeout(r,500));
    assert.match(logs,/Ready/);
    const paths = invalid ? ['/','/demo'] : ['/','/demo', ...['missing-independent','stale-token','closed-stale-reference','missing-multiplier','stale-reference','fresh-evidence','missing-timestamp','provider-disagreement','insufficient-liquidity','high-slippage','market-closed','api-unavailable'].map(s=>`/demo?scenario=${s}`), '/demo?scenario=invalid', '/unknown'];
    for (const path of paths) {
      const response = await localFetch(`http://127.0.0.1:${port}${path}`);
      const html = await response.text();
      if(invalid) { assert.ok(response.status>=500); assert.doesNotMatch(html,/Fictional Example Company|Historical discovery/); }
      else {
        assert.equal(response.status, path==='/unknown'?404:200);
        assert.match(html,/SYNTHETIC DEMO/);
        assert.doesNotMatch(html,/1\.0017152487959898|Historical discovery|NVDAon|tokenContractAddresses/);
      }
    }
    if (!invalid) {
      // Visitors cannot select live mode through request-controlled input.
      const attacks = [
        '/?mode=live', '/?AFTERCLOSE_PREVIEW_MODE=live', '/?mode=%00live',
        '/demo?scenario=fresh-evidence&mode=live',
        '/demo?scenario=../../live', '/demo?scenario=%00',
        '/demo?scenario=live&scenario=fresh-evidence',
      ];
      const headers = { 'x-afterclose-preview-mode':'live', 'AFTERCLOSE_PREVIEW_MODE':'live', 'x-vercel-env':'development', 'Cookie':'AFTERCLOSE_PREVIEW_MODE=live' };
      for (const path of attacks) for (const rsc of [false, true]) {
        const r = await localFetch(`http://127.0.0.1:${port}${path}`, { headers:{...headers,...(rsc ? {RSC:'1'} : {})} });
        assert.equal(r.status,200);
        const body = await r.text();
        assert.match(body,/SYNTHETIC (DEMO|SCENARIO)/);
        assert.doesNotMatch(body,/Historical discovery|NVDAon|1\.0017152487959898/);
      }
      for (const path of ['/live','/demo/live','/api/live']) {
        const r = await localFetch(`http://127.0.0.1:${port}${path}`, { headers });
        assert.equal(r.status,404);
        assert.match(await r.text(),/SYNTHETIC DEMO/);
      }
      const metadata = await (await localFetch(`http://127.0.0.1:${port}/`)).text();
      assert.match(metadata,/<title>AfterClose \| Synthetic demo<\/title>/);
      assert.match(metadata,/name="robots" content="noindex, nofollow"/);
      console.log('PASS 14 adversarial HTML/RSC requests, 3 route-parameter probes, metadata');
      for(let i=0;i<3;i++) {
        const r = await localFetch(`http://127.0.0.1:${port}/?_rsc=rehearsal${i}`, { headers:{RSC:'1','Cache-Control':'no-cache'} });
        assert.equal(r.status,200); const body=await r.text(); assert.match(body,/Synthetic preview|Fictional Example/); assert.doesNotMatch(body,/Historical discovery|NVDAon/);
      }
      const html=await (await localFetch(`http://127.0.0.1:${port}/`)).text();
      const assets=[...new Set([...html.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g)].map(m=>m[1]))];
      assert.ok(assets.length>0);
      for(const asset of assets) { const r=await localFetch(`http://127.0.0.1:${port}${asset}`); assert.equal(r.status,200); const b=await r.text(); assert.doesNotMatch(b,/1\.0017152487959898|BINANCE_SECRET_KEY|Historical discovery/); }
      console.log(`PASS synthetic routes, 12 scenarios, invalid scenario, 404, RSC refresh x3, ${assets.length} assets`);
    } else console.log('PASS invalid runtime mode: dashboard and lab fail closed');
  } finally { writeFileSync(join(stage, 'runtime-' + mode + '.log'), logs); if (child.exitCode === null) await new Promise(r => { child.once('exit', r); child.kill(); }); }
}
await check('synthetic');
await check('typo',true);
assert.equal(readFileSync(audit,'utf8'),'');
assert.ok(!existsSync(join(stage,'.env.local')));
console.log('PASS zero server fetch attempts across production build and runtime; no provider secrets or env files supplied');
console.log(`Rehearsal artifacts: ${stage}`);
