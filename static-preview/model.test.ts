import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRoute, scenarioNames, scenarioView } from './model';
import { DEMO_NOW, syntheticFixture, type Scenario } from '../src/demo/reference-fixtures';
import { evaluateReferenceTruth, type Decision } from '../src/lib/reference-truth/engine';
const expectations: Record<Scenario, Decision> = {
  'missing-independent':'WAIT', 'stale-token':'WAIT', 'closed-stale-reference':'WAIT',
  'missing-multiplier':'WAIT', 'stale-reference':'WAIT', 'fresh-evidence':'PROCEED_TO_REVIEW',
  'missing-timestamp':'WAIT', 'provider-disagreement':'WAIT', 'insufficient-liquidity':'WAIT',
  'high-slippage':'WAIT', 'market-closed':'MONITOR', 'api-unavailable':'WAIT',
};
for(const id of Object.keys(scenarioNames) as Scenario[]) test(`Static parity: ${id}`,()=>{
  const view=scenarioView(id);
  assert.deepEqual(view.result,evaluateReferenceTruth(syntheticFixture(id),DEMO_NOW));
  assert.equal(view.result.decision,expectations[id]);
  assert.equal(view.result.mode,'synthetic');assert.equal(view.result.execution,'DISABLED');
});
test('Static scenario calls do not mutate shared fixtures',()=>{
  const before=scenarioView('fresh-evidence');const other=scenarioView('fresh-evidence');other.evidence.references.length=0;
  assert.deepEqual(scenarioView('fresh-evidence'),before);
});
test('All 12 direct hash links resolve and home is explicit',()=>{
  assert.equal(Object.keys(scenarioNames).length,12);
  for(const id of Object.keys(scenarioNames))assert.deepEqual(parseRoute('#/lab/'+id),{kind:'scenario',id});
  for(const hash of ['','#','#/'])assert.deepEqual(parseRoute(hash),{kind:'home'});
});
test('Unknown and malformed routes do not invent a scenario',()=>{
  for(const hash of ['#/lab/live','#/lab/__proto__','#/lab/%00','#/lab/fresh-evidence?mode=live','#/<script>','#/lab/../../live'])assert.deepEqual(parseRoute(hash),{kind:'missing'});
});
