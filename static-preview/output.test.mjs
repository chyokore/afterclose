import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
const root='static-preview/dist';
function files(dir,prefix=''){return readdirSync(dir).flatMap(name=>statSync(join(dir,name)).isDirectory()?files(join(dir,name),prefix+name+'/'):[prefix+name]);}
const output=files(root).sort();
test('Output is exactly six static files, with no function or server entry',()=>{
 assert.deepEqual(output,['.nojekyll','404.html','_headers','assets/preview.css','assets/preview.js','index.html']);
});
test('Bundle contains no server/provider capability or captured historical observation',()=>{
 const js=readFileSync(join(root,'assets/preview.js'),'utf8');
 assert.doesNotMatch(js,/server-only|process\.env|BINANCE_API_KEY|BINANCE_SECRET_KEY|NVDAon|1\.0017152487959898|fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
});
test('Browser graph only includes the canonical engine, fixtures, Zod and static UI',()=>{
 const meta=JSON.parse(readFileSync('.tools/static-preview/metafile.json','utf8'));
 for(const file of Object.keys(meta.inputs))assert.match(file,/^(static-preview\/(app|model)\.ts|src\/demo\/reference-fixtures\.ts|src\/lib\/reference-truth\/(engine|models)\.ts|node_modules\/zod\/)/);
 assert.ok(meta.inputs['src/lib/reference-truth/engine.ts']);
});
test('HTML and CSP retain prominent synthetic labels and disable connections',()=>{
 for(const file of ['index.html','404.html'])assert.match(readFileSync(join(root,file),'utf8'),/SYNTHETIC DEMONSTRATION — NOT LIVE MARKET DATA/);
 assert.match(readFileSync(join(root,'index.html'),'utf8'),/connect-src 'none'/);
 assert.match(readFileSync(join(root,'_headers'),'utf8'),/connect-src 'none'/);
});
