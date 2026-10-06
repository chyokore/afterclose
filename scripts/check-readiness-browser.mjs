import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { scenarioNames, syntheticFixture, DEMO_NOW } from '../src/demo/reference-fixtures.ts';
import { evaluateReferenceTruth } from '../src/lib/reference-truth/engine.ts';
const require=createRequire(import.meta.url);
const {chromium}=require('../.tools/static-browser-qa/node_modules/playwright');
const directory='.tools/readiness/browser-artifacts';mkdirSync(directory,{recursive:true});
const captures='docs/qa/live-readiness';mkdirSync(captures,{recursive:true});
const errors=[],external=[],results=[];
let artifactId=0;
const browser=await chromium.launch({channel:'msedge',headless:true});
async function run(mode,port,check){
  const env={...process.env,NODE_USE_SYSTEM_CA:'1',NEXT_TELEMETRY_DISABLED:'1'};
  delete env.AFTERCLOSE_PREVIEW_MODE; env.AFTERCLOSE_DEPLOYMENT_MODE='competition-live';
  env.AFTERCLOSE_NETWORK_AUDIT=resolve(`${directory}/${mode}-network.txt`);writeFileSync(env.AFTERCLOSE_NETWORK_AUDIT,'');
  if(mode==='live')env.NODE_OPTIONS=`--require="${resolve('scripts/readiness-fetch-audit.cjs').replaceAll('\\','/')}"`;
  if(mode!=='live'){
    env.BINANCE_API_KEY='';env.BINANCE_SECRET_KEY='';
    env.AFTERCLOSE_NETWORK_AUDIT=resolve(`${directory}/${mode}-network.txt`);writeFileSync(env.AFTERCLOSE_NETWORK_AUDIT,'');
    env.NODE_OPTIONS=`--require="${resolve('scripts/deny-rehearsal-network.cjs').replaceAll('\\','/')}"`;
  }
  if(mode==='synthetic')env.AFTERCLOSE_DEPLOYMENT_MODE='synthetic';
  if(mode==='missing-mode')delete env.AFTERCLOSE_DEPLOYMENT_MODE;
  if(mode==='invalid-mode')env.AFTERCLOSE_DEPLOYMENT_MODE='unknown';
  if(mode==='conflict')env.AFTERCLOSE_PREVIEW_MODE='synthetic';
  if(mode==='malformed')env.BINANCE_API_KEY='bad value';
  if(mode==='loading'){
    env.BINANCE_API_KEY='local-qa-only';env.BINANCE_SECRET_KEY='local-qa-only';
    env.NODE_OPTIONS=`--require="${resolve('scripts/readiness-slow-failure.cjs').replaceAll('\\','/')}"`;
  }
  const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','0.0.0.0','--port',String(port)],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let logs='';child.stdout.on('data',d=>logs+=d);child.stderr.on('data',d=>logs+=d);
  const origin=`http://127.0.0.1:${port}`;
  const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write'],serviceWorkers:'block'});
  await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.origin!==origin){external.push(u.origin);return route.abort();}return route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  page.setDefaultTimeout(120000);page.setDefaultNavigationTimeout(120000);
  const capturesPending=[];
  page.on('response',response=>{
    if(new URL(response.url()).origin===origin)capturesPending.push(response.body().then(body=>writeFileSync(`${directory}/${mode}-${++artifactId}.response`,body)).catch(()=>{}));
  });
  try{
    for(let i=0;i<120&&!logs.includes('Ready');i++)await new Promise(r=>setTimeout(r,500));
    assert.match(logs,/Ready/);
    await check(page,origin);
    // Streaming/navigation cancellation can leave response.body() pending. Never
    // make application QA depend on an indefinitely open diagnostic stream.
    await Promise.race([Promise.allSettled(capturesPending),new Promise(r=>setTimeout(r,5000))]);
    if(mode!=='live')assert.equal(readFileSync(env.AFTERCLOSE_NETWORK_AUDIT,'utf8'),'');
  }finally{
    writeFileSync(`${directory}/browser-${mode}.log`,logs);await context.close();
    if(child.exitCode===null)await new Promise(r=>{child.once('exit',r);child.kill();});
  }
}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${page.url()}`);}
try{
  await run('live',3192,async(page,origin)=>{
    const response=await page.goto(origin+'/live',{timeout:120000,waitUntil:'domcontentloaded'});assert.equal(response.status(),200);
    await page.locator('[data-live-decision]').waitFor();assert.equal(await page.locator('[data-live-decision]').innerText(),'WAIT');
    const panel=page.locator('.receipt-inspector').first();await panel.locator('summary').click();
    let canonical=await panel.locator('textarea').inputValue(),receipt=JSON.parse(canonical);
    if(receipt.observation.state!=='connected'){
      writeFileSync(`${directory}/initial-unavailable-receipt.json`,canonical);
      await page.waitForTimeout(61000);await page.reload({waitUntil:'domcontentloaded'});
      await panel.locator('summary').click();canonical=await panel.locator('textarea').inputValue();receipt=JSON.parse(canonical);
    }
    assert.equal(receipt.observation.state,'connected');assert.equal(receipt.discovery,'MATCH');
    assert.equal(receipt.mode,'live');assert.equal(receipt.engine.result.decision,'WAIT');
    const digest=await page.locator('[data-receipt-digest]').innerText();
    assert.equal(createHash('sha256').update(canonical).digest('hex'),digest);
    await panel.getByRole('button',{name:'Copy receipt JSON'}).click();
    await panel.getByText('Receipt JSON copied.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),canonical);
    writeFileSync(`${directory}/browser-live-receipt.json`,canonical);
    const health=await page.request.get(origin+'/api/health');assert.equal(health.status(),200);
    const h=await health.json();assert.equal(h.mode,'competition-live');assert.match(h.build.sourceDigest,/^[a-f0-9]{64}$/);
    writeFileSync(`${directory}/health.json`,JSON.stringify(h));
    assert.equal((await page.request.post(origin+'/api/health')).status(),405);
    assert.equal((await page.request.get(origin+'/api/health?url=evil')).status(),400);
    await panel.locator('summary').click();
    for(const width of [1440,390,320]){
      await page.setViewportSize({width,height:width===1440?1000:844});await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await noOverflow(page);
      await page.screenshot({path:`${captures}/live-${width}.png`});
      const verdict=await page.locator('[data-live-decision]').boundingBox();assert.ok(verdict.y+verdict.height<844,'verdict must be in first viewport');
    }
    await page.getByText('Source · provider time · observed · age · derived · used by engine',{exact:true}).click();
    await noOverflow(page);await page.getByRole('region',{name:'Evidence provenance'}).scrollIntoViewIfNeeded();
    await page.screenshot({path:`${captures}/provenance-320.png`});
    await page.locator('.receipt-inspector').first().locator('summary').click();await noOverflow(page);
    await page.waitForTimeout(31000);
    assert.notEqual(await page.locator('[data-token-status]').innerText(),'LIVE');
    const before=readFileSync(`${directory}/live-network.txt`,'utf8');
    await page.goto(origin+'/live?url=https://evil.invalid&method=POST');
    await page.getByRole('heading',{name:'LIVE EVIDENCE UNAVAILABLE'}).waitFor();
    assert.equal(readFileSync(`${directory}/live-network.txt`,'utf8'),before);
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
  let port=3195;
  for(const mode of ['missing-mode','invalid-mode','conflict','malformed'])await run(mode,port++,async(page,origin)=>{
    await page.goto(origin+'/live');await page.getByRole('heading',{name:'LIVE EVIDENCE UNAVAILABLE'}).waitFor();
    assert.equal((await page.request.get(origin+'/api/health')).status(),503);
    await page.goto(origin+'/demo');await page.locator('.demo-intro .demo-banner').waitFor();assert.match(await page.locator('.demo-intro .demo-banner').innerText(),/SYNTHETIC SCENARIO/);
    results.push({mode,live:'unavailable',scenario:'accessible',outboundFetchAttempts:0});
  });
  await run('loading',3199,async(page,origin)=>{
    await page.goto(origin+'/demo');await page.getByRole('link',{name:'← Open LIVE EVIDENCE'}).click();
    await page.getByRole('heading',{name:'Starting live evidence service…'}).waitFor();
    await page.screenshot({path:`${captures}/loading.png`});
    await page.getByRole('heading',{name:'LIVE EVIDENCE UNAVAILABLE'}).waitFor();
    assert.equal(await page.locator('[data-live-decision]').innerText(),'WAIT');
    results.push({mode:'loading',delayedFailure:'safe',fabricatedPrices:0,outboundFetchAttempts:0});
  });
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  const requests=readFileSync(`${directory}/live-network.txt`,'utf8').trim().split('\n');
  const binanceRequests=requests.filter(x=>x==='binance').length,ondoRequests=requests.filter(x=>x==='ondo').length;
  assert.ok(binanceRequests>=6&&binanceRequests<=12);assert.ok(ondoRequests>=1&&ondoRequests<=2);
  writeFileSync(`${captures}/results.json`,JSON.stringify({results,browserErrors:errors,externalBrowserRequests:external,artifactsCaptured:readdirSync(directory).filter(n=>n.endsWith('.response')).length,binanceRequests,ondoRequests},null,2));
  console.log(JSON.stringify({results,browserErrors:errors.length,externalBrowserRequests:external.length}));
}finally{await browser.close();}
