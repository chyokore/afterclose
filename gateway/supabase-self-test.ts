// Gate A runtime checks only. No network, market observation, or transaction simulation.
import { canonicalize, createEvidenceReceipt, digestOf } from '../src/lib/competition/receipt';
import { evaluateReferenceTruth } from '../src/lib/reference-truth/engine';
import { truthInputSchema } from '../src/lib/reference-truth/models';
import { unavailableObservation } from '../src/lib/competition/unavailable';
import { evidenceCache } from '../src/lib/competition/cache';
import { withMetrics, measure } from '../src/lib/metrics';

export async function runtimeSelfTest(engineCases: {name:string;input:unknown;at:number}[]) {
  const engine = engineCases.map(({name,input,at})=>{
    const parsed=truthInputSchema.parse(input);
    const result=evaluateReferenceTruth(parsed,at);
    return {name,decision:result.decision,canonicalJson:canonicalize(result),digest:digestOf(result)};
  });
  const receipts=['configuration','provider'].map(reason=>{
    const envelope=createEvidenceReceipt(unavailableObservation(reason as 'configuration'|'provider'),1791374400000);
    return {name:reason,canonicalJson:envelope.canonicalJson,digest:envelope.digest};
  });
  const reordered=digestOf({b:2,a:1})===digestOf({a:1,b:2});
  const bytes=new TextEncoder().encode('abc');
  const webSha=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('');
  let t=0,captures=0;
  const cached=evidenceCache(async()=>++captures,()=>false,()=>t);
  const initial=await Promise.all([cached(),cached()]);t=29999;await cached();t=30000;await cached();
  const cache=initial[0]===initial[1]&&captures===2;
  const timeout=AbortSignal.timeout(1);
  await new Promise(resolve=>setTimeout(resolve,5));
  const metrics:Record<string,number>={};withMetrics(metrics,()=>measure('probe',()=>1));
  return {engine,receipts,checks:{deterministicJson:reordered,webCryptoSha256:webSha==='ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',cache,abortTimeout:timeout.aborted,asyncLocalStorage:Number.isFinite(metrics.probe),timestamps:Date.parse('2026-10-07T12:00:00Z')===1791374400000}};
}
