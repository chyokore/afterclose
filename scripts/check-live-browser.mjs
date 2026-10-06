import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { scenarioNames, syntheticFixture, DEMO_NOW } from '../src/demo/reference-fixtures.ts';
import { evaluateReferenceTruth } from '../src/lib/reference-truth/engine.ts';
const require=createRequire(import.meta.url);
const {chromium}=require('../.tools/static-browser-qa/node_modules/playwright');
const directory='.tools/competition';mkdirSync(directory,{recursive:true});
const captures='docs/qa/live-evidence';mkdirSync(captures,{recursive:true});
const errors=[],external=[],results=[];
const browser=await chromium.launch({channel:'msedge',headless:true});
async function run(mode,port,check){
  const env={...process.env,NODE_USE_SYSTEM_CA:'1',NEXT_TELEMETRY_DISABLED:'1'};
  delete env.AFTERCLOSE_PREVIEW_MODE;
  if(mode!=='live'){
    env.BINANCE_API_KEY='';env.BINANCE_SECRET_KEY='';
    env.AFTERCLOSE_NETWORK_AUDIT=resolve(`${directory}/${mode}-network.txt`);writeFileSync(env.AFTERCLOSE_NETWORK_AUDIT,'');
    env.NODE_OPTIONS=`--require="${resolve('scripts/deny-rehearsal-network.cjs').replaceAll('\\','/')}"`;
  }
  if(mode==='synthetic')env.AFTERCLOSE_PREVIEW_MODE='synthetic';
  const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
  const origin=`http://127.0.0.1:${port}`;
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],serviceWorkers:'block'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin){external.push(u.origin);return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  try{
    for(let i=0;i<120&&!logs.includes('Ready');i++)await new Promise(r=>setTimeout(r,500));
    assert.match(logs,/Ready/);
    await check(page,origin);
    if(mode!=='live')assert.equal(readFileSync(env.AFTERCLOSE_NETWORK_AUDIT,'utf8'),'');
  }finally{
    writeFileSync(`${directory}/browser-${mode}.log`,logs);await context.close();
    if(child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill();});
  }
}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${page.url()}`);}
try{
  await run('live',3192,async(page,origin)=>{
    const response=await page.goto(origin+'/live',{timeout:60000});assert.equal(response.status(),200);
    await page.locator('[data-live-decision]').waitFor();assert.equal(await page.locator('[data-live-decision]').innerText(),'WAIT');
    const panel=page.locator('.receipt-inspector').first();await panel.locator('summary').click();
    const canonical=await panel.locator('textarea').inputValue();const receipt=JSON.parse(canonical);
    assert.equal(receipt.observation.state,'connected');assert.equal(receipt.discovery,'MATCH');
    assert.equal(receipt.mode,'live');assert.equal(receipt.engine.result.decision,'WAIT');
    const digest=await page.locator('[data-receipt-digest]').innerText();
    assert.equal(createHash('sha256').update(canonical).digest('hex'),digest);
    await panel.getByRole('button',{name:'Copy receipt JSON'}).click();
    await panel.getByText('Receipt JSON copied.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),canonical);
    writeFileSync(`${directory}/browser-live-receipt.json`,canonical);
    await panel.locator('summary').click();
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:width===1440?1000:844});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await noOverflow(page);
      await page.screenshot({path:`${captures}/live-${width}.png`});
    }
    await page.getByText('Source · provider time · observed · age · derived · used by engine',{exact:true}).click();
    await noOverflow(page);await page.getByRole('region',{name:'Evidence provenance'}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`${captures}/provenance-320.png`});
    await page.locator('.receipt-inspector').first().locator('summary').click();await noOverflow(page);
    await page.setViewportSize({width:390,height:844});
    for(const id of Object.keys(scenarioNames)){
      await page.goto(`${origin}/demo?scenario=${id}`);
      await page.locator('.truth-state').waitFor();
      assert.equal(await page.locator('.truth-state').innerText(),evaluateReferenceTruth(syntheticFixture(id),DEMO_NOW).decision);
      assert.match(await page.locator('.demo-intro .demo-banner').innerText(),/SYNTHETIC/);await noOverflow(page);
    }
    await page.goto(`${origin}/demo?scenario=fresh-evidence`);await page.locator('.truth-state').waitFor();
    assert.equal(await page.getByRole('link',{name:'← Open LIVE EVIDENCE'}).getAttribute('href'),'/live');
    await page.screenshot({path:`${captures}/scenario-review-390.png`});
    results.push({mode:'live',viewports:[1440,390,320],scenarioChecks:12,clipboard:'passed',digest,providerEvaluationsInspected:1,observedAtMs:receipt.evaluatedAtMs,classification:receipt.freshness.status,decision:receipt.engine.result.decision,endpoints:receipt.observation.audits});
  });
  await run('unavailable',3193,async(page,origin)=>{
    await page.setViewportSize({width:390,height:844});await page.goto(origin+'/live');
    await page.getByRole('heading',{name:'LIVE EVIDENCE UNAVAILABLE'}).waitFor();
    assert.equal(await page.locator('[data-token-price]').innerText(),'Unavailable');
    assert.match(await page.locator('body').innerText(),/HISTORICAL · never a current\/live substitute/);
    assert.equal(await page.locator('[data-live-decision]').innerText(),'WAIT');await noOverflow(page);
    await page.screenshot({path:`${captures}/unavailable-390.png`});
    results.push({mode:'unavailable',credentialConfiguration:'empty test override',snapshot:'separate HISTORICAL',outboundFetchAttempts:0});
  });
  await run('synthetic',3194,async(page,origin)=>{
    await page.goto(origin+'/live?mode=live');await page.getByText('SYNTHETIC DEMO — NOT LIVE MARKET DATA',{exact:true}).waitFor();
    const text=await page.locator('body').innerText();assert.doesNotMatch(text,/NVDAon|241\.622|Evidence Receipt/);
    results.push({mode:'synthetic',liveRoute:'guarded',outboundFetchAttempts:0});
  });
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  writeFileSync(`${captures}/results.json`,JSON.stringify({results,browserErrors:errors,externalBrowserRequests:external},null,2));
  console.log(JSON.stringify({results,browserErrors:errors.length,externalBrowserRequests:external.length}));
}finally{await browser.close();}
