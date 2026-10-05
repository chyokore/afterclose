import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { staticServer } from './serve-static-preview.mjs';
import { scenarioNames, syntheticFixture, DEMO_NOW } from '../src/demo/reference-fixtures.ts';
import { evaluateReferenceTruth } from '../src/lib/reference-truth/engine.ts';
const require=createRequire(import.meta.url);
const {chromium}=require('../.tools/static-browser-qa/node_modules/playwright');
const server=staticServer();await new Promise(r=>server.listen(3190,'127.0.0.1',r));
const origin='http://127.0.0.1:3190';
const captures='docs/qa/static-preview';mkdirSync(captures,{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
const external=[],requests=[],errors=[];let apiAttempts=0,scenarios=0,overflowChecks=0,refreshChecks=0,keyboardChecks=0,missingChecks=0,directScenarioChecks=0;
async function instrument(context){
 await context.route('**/*',route=>{const url=route.request().url();requests.push({url,type:route.request().resourceType()});if(new URL(url).origin!==origin){external.push(url);return route.abort();}return route.continue();});
 await context.addInitScript(()=>{
  window.__apiAttempts=0;
  const deny=()=>{window.__apiAttempts++;throw new Error('API/network capability forbidden in static QA');};
  window.fetch=deny;XMLHttpRequest.prototype.open=deny;window.WebSocket=deny;window.EventSource=deny;navigator.sendBeacon=deny;
 });
}
async function audit(page){apiAttempts+=await page.evaluate(()=>window.__apiAttempts??0);assert.equal(await page.evaluate(()=>window.__apiAttempts??0),0);}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Page overflow ${page.url()}`);overflowChecks++;}
try{
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:width===1440?1000:844},serviceWorkers:'block'});await instrument(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.locator('.hero').waitFor();await noOverflow(page);
  assert.match(await page.locator('.synthetic-banner').innerText(),/SYNTHETIC DEMONSTRATION — NOT LIVE MARKET DATA/);
  await page.screenshot({path:`${captures}/landing-${width}.png`});
  await page.keyboard.press('Tab');assert.equal(await page.locator(':focus').getAttribute('class'),'skip');await page.keyboard.press('Enter');assert.equal(await page.locator(':focus').getAttribute('id'),'main');keyboardChecks++;
  await page.getByRole('link',{name:'Explore the scenario lab'}).click();await page.locator('[data-decision]').waitFor();
  for(const id of Object.keys(scenarioNames)){
   if(width===1440)await page.locator(`.scenario-nav a[href="#/lab/${id}"]`).click();else await page.locator('#scenario-select').selectOption(id);
   await page.waitForURL('**/#/lab/'+id);
   const expected=evaluateReferenceTruth(syntheticFixture(id),DEMO_NOW);
   assert.equal(await page.locator('[data-decision]').innerText(),expected.decision);
   assert.deepEqual(await page.locator('[data-code]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-code'))),expected.findings.map(f=>f.code));
   assert.match(await page.locator('.clock').innerText(),/2026-09-26T12:00:00.000Z/);
   await noOverflow(page);await audit(page);scenarios++;
   if(width===1440){await page.reload();await page.locator('[data-decision]').waitFor();assert.equal(await page.locator('[data-decision]').innerText(),expected.decision);await audit(page);directScenarioChecks++;}
   if(id==='stale-reference'||id==='fresh-evidence')await page.screenshot({path:`${captures}/${id==='stale-reference'?'wait':'review'}-${width}.png`});
  }
  await page.goto(origin+'/#/lab/fresh-evidence');await page.locator('[data-decision]').waitFor();assert.equal(await page.locator('[data-decision]').innerText(),'PROCEED_TO_REVIEW');
  await page.reload();await page.locator('[data-decision]').waitFor();assert.equal(await page.locator('[data-decision]').innerText(),'PROCEED_TO_REVIEW');refreshChecks++;
  const table=page.locator('.table-scroll');await table.focus();await page.keyboard.press('ArrowRight');await page.waitForTimeout(150);assert.ok(await table.evaluate(el=>el.scrollWidth<=el.clientWidth||el.scrollLeft>0));keyboardChecks++;
  if(width===390){await page.locator('.metrics').scrollIntoViewIfNeeded();await page.screenshot({path:`${captures}/evidence-390.png`});}
  if(width!==1440){await page.locator('#scenario-select').focus();await page.keyboard.press('Home');await page.keyboard.press('Enter');await page.waitForURL('**/#/lab/missing-independent');assert.equal(await page.locator('[data-decision]').innerText(),'WAIT');keyboardChecks++;}
  await page.goto(origin+'/#/lab/not-real');await page.getByRole('heading',{name:'This scenario does not exist.'}).waitFor();assert.equal(await page.locator('[data-decision]').count(),0);await noOverflow(page);missingChecks++;
  const notFound=await page.goto(origin+'/missing');assert.equal(notFound.status(),404);assert.match(await page.locator('body').innerText(),/SYNTHETIC DEMONSTRATION/);await noOverflow(page);missingChecks++;await audit(page);
  await page.goto(origin+'/afterclose/#/lab/stale-reference');await page.locator('[data-decision]').waitFor();assert.equal(await page.locator('[data-decision]').innerText(),'WAIT');await audit(page);
  await context.close();
 }
 // Induce a local fixture failure to exercise the shipped error UI, not a fake engine substitute.
 const errorContext=await browser.newContext({serviceWorkers:'block'});await instrument(errorContext);await errorContext.addInitScript(()=>{window.structuredClone=()=>{throw new Error('QA fixture failure');};});const errorPage=await errorContext.newPage();await errorPage.goto(origin+'/#/lab/fresh-evidence');await errorPage.getByRole('alert').waitFor();assert.equal(await errorPage.locator('[data-decision]').count(),0);assert.match(await errorPage.locator('.synthetic-banner').innerText(),/NOT LIVE MARKET DATA/);await audit(errorPage);await errorContext.close();
 assert.deepEqual(external,[]);assert.equal(apiAttempts,0);assert.deepEqual(errors,[]);
 assert.ok(requests.every(r=>['document','script','stylesheet'].includes(r.type)));
 const result={scenarioDecisionAndFindingParity:scenarios,directScenarioChecks,overflowChecks,refreshChecks,keyboardChecks,missingChecks,errorChecks:1,projectPrefixChecks:3,screenshots:10,externalRequests:external.length,apiAttempts,pageErrors:errors.length,localAssetRequests:requests.length,widths:[1440,390,320]};
 writeFileSync('.tools/static-preview/browser-results.json',JSON.stringify(result,null,2));writeFileSync('.tools/static-preview/network.json',JSON.stringify(requests,null,2));console.log(JSON.stringify(result));
}finally{await browser.close();await new Promise(r=>server.close(r));}
