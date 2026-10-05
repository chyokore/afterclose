import { DEMO_NOW, scenarioNames, syntheticFixture, type Scenario } from '../src/demo/reference-fixtures';
import { evaluateReferenceTruth } from '../src/lib/reference-truth/engine';

export { DEMO_NOW, scenarioNames };
export const SYNTHETIC_LABEL = 'SYNTHETIC DEMONSTRATION — NOT LIVE MARKET DATA';
export function scenarioView(id: Scenario) {
  const evidence = syntheticFixture(id);
  return { id, title: scenarioNames[id], evidence, result: evaluateReferenceTruth(evidence, DEMO_NOW) };
}
export function parseRoute(hash: string): { kind: 'home' } | { kind: 'scenario'; id: Scenario } | { kind: 'missing' } {
  if (hash === '' || hash === '#' || hash === '#/') return { kind: 'home' };
  const match = /^#\/lab\/([a-z-]+)$/.exec(hash);
  if (match && Object.hasOwn(scenarioNames, match[1])) return { kind: 'scenario', id: match[1] as Scenario };
  return { kind: 'missing' };
}
