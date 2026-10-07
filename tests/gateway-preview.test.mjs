import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('local frontend is separately hosted and its CSP permits only the local gateway',async()=>{
  const html=await readFile('.tools/gateway-preview/index.html','utf8');assert.match(html,/connect-src http:\/\/127\.0\.0\.1:4174;/);assert.match(html,/LIVE EVIDENCE/);assert.match(html,/SCENARIO LAB/);assert.match(html,/\.\/lab\/#\/lab\/fresh-evidence/);
  const js=await readFile('.tools/gateway-preview/live.js','utf8');assert.match(js,/127\.0\.0\.1:4174\/api\/live-evidence/);assert.match(js,/credentials:"omit"/);assert.match(js,/SHA-256/);assert.doesNotMatch(js,/BINANCE_API_KEY|BINANCE_SECRET_KEY|web3\.binance\.com|X-OC-/);
});
test('prototype Scenario Lab retains offline policy and exact canonical application bundle',async()=>{
  assert.deepEqual(await readFile('.tools/gateway-preview/lab/assets/preview.js'),await readFile('static-preview/dist/assets/preview.js'));const html=await readFile('.tools/gateway-preview/lab/index.html','utf8');assert.match(html,/connect-src 'none'/);assert.match(html,/href="\.\.\/">LIVE EVIDENCE/);assert.match(html,/SYNTHETIC DEMONSTRATION/);
});
test('deployment package exposes one statically configured function and no browser credentials',async()=>{
  const entry=await readFile('.tools/gateway-package/functions/live-evidence.mjs','utf8');assert.match(entry,/export const config=\{path:"\/api\/live-evidence",memory:1024\}/);assert.match(entry,/\.\.\/lib\/evidence.mjs/);const html=await readFile('.tools/gateway-package/public/index.html','utf8');assert.doesNotMatch(html,/BINANCE_|<script/);
});
