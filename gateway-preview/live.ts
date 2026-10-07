import type { GatewayResponse } from '../gateway/contract';
// Generic canonical JSON only; decisions always come from the canonical server engine.
export function canonicalJson(value:unknown):string{
  if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value);
  if(typeof value==='number'&&Number.isFinite(value))return JSON.stringify(value);
  if(Array.isArray(value))return `[${value.map(canonicalJson).join(',')}]`;
  if(value&&typeof value==='object'&&Object.getPrototypeOf(value)===Object.prototype)return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${canonicalJson((value as Record<string,unknown>)[k])}`).join(',')}}`;
  throw Error('Invalid receipt');
}
const escape=(v:unknown)=>String(v??'Unavailable').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const time=(v:number|null|undefined)=>v==null?'Unavailable':new Date(v).toISOString();
const age=(v:number|null|undefined)=>v==null?'Unavailable':`${(v/1000).toFixed(1)} seconds`;
const status=document.querySelector<HTMLElement>('#status')!;
const evidence=document.querySelector<HTMLElement>('#evidence')!;
const button=document.querySelector<HTMLButtonElement>('#refresh')!;
let evaluationAt:number|null=null;
setInterval(()=>{const clock=document.querySelector('#elapsed');if(clock&&evaluationAt!==null)clock.textContent=`${Math.max(0,(Date.now()-evaluationAt)/1000).toFixed(0)} seconds since this evaluation. Receipt clocks below are fixed; refresh to reclassify.`;},1000);
button.addEventListener('click',async()=>{
  button.disabled=true;evidence.replaceChildren();evaluationAt=null;status.textContent='Fetching current Binance Web3 evidence…';
  try{
    const response=await fetch('http://127.0.0.1:4174/api/live-evidence',{mode:'cors',credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(30000)});
    const body=await response.json() as GatewayResponse;
    if(!response.ok||body.schemaVersion!=='afterclose-live-gateway/v1'||body.status!=='LIVE_EVIDENCE'||!body.receipt)throw Error('Unavailable');
    const r=body.receipt;
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonicalJson(r))))).map(x=>x.toString(16).padStart(2,'0')).join('');
    if(digest!==body.receiptDigest)throw Error('Receipt integrity');
    evaluationAt=r.evaluatedAtMs;
    status.textContent=`Binance observation received · ${r.freshness.status} at evaluation · receipt digest verified`;
    const price=r.fields.find(f=>f.id==='token-price');
    evidence.innerHTML=`<div class="grid"><div class="card"><p class="label">Evidence completeness</p><div class="value">${escape(r.evidenceStatus)}</div><p>Independent NVDA reference unavailable</p></div><div class="card"><p class="label">Canonical verdict</p><div class="value wait">${escape(r.engine.result.decision)}</div><p>No execution authorization</p></div><div class="card"><p class="label">NVDAon · USD per token</p><div class="value">${escape(price?.raw)}</div><p>${escape(r.freshness.status)} at evaluation</p></div></div>
    <div class="card"><h2>Clocks that do not reset</h2><p id="elapsed" class="clock">Evaluation just received. Receipt clocks remain fixed.</p><dl><dt>Provider price time</dt><dd>${escape(time(price?.providerAtMs))}</dd><dt>AfterClose observed</dt><dd>${escape(time(price?.observedAtMs))}</dd><dt>Evaluated</dt><dd>${escape(time(r.evaluatedAtMs))}</dd><dt>Provider age at evaluation</dt><dd>${escape(age(price?.providerDataAgeMs))}</dd><dt>Observation age at evaluation</dt><dd>${escape(age(price?.observationAgeMs))}</dd></dl><p class="clock">An instance may reuse evidence for 30 seconds. Metadata keeps its original observation time. Browser refresh does not create a new provider timestamp.</p></div>
    <div class="card"><h2>Why AfterClose waits</h2><ul>${r.engine.result.findings.filter(f=>f.severity==='blocking').map(f=>`<li><strong>${escape(f.code)}</strong>: ${escape(f.message)}</li>`).join('')}</ul><dl><dt>Independent reference</dt><dd>${escape(r.independentReference.reason)}</dd><dt>Multiplier</dt><dd>${escape(r.multiplier.status)} — no confirmed effective date or validity interval</dd><dt>Authoritative session</dt><dd>${escape(r.session.authoritative)}</dd><dt>Execution evidence</dt><dd>${escape(r.execution.simulation)}</dd></dl></div>
    <details><summary>Inspect evidence receipt and digest</summary><p>SHA-256 verified in this browser</p><code>${escape(body.receiptDigest)}</code><p class="clock">Engine ${escape(r.engine.id)}<br>Build ${escape(body.build.commit)} · source ${escape(body.build.sourceDigest)} · dirty ${escape(body.build.dirty)}</p><pre>${escape(JSON.stringify(r,null,2))}</pre></details><div class="card"><h2>What would complete evidence change?</h2><p>Explore the explicitly fictional complete-evidence case in Scenario Lab.</p><a href="./lab/#/lab/fresh-evidence">Open Scenario Lab →</a></div>`;
  }catch{status.textContent='LIVE_EVIDENCE_UNAVAILABLE';evidence.innerHTML='<div class="card error"><h2>Live evidence unavailable</h2><p>The gateway or provider could not supply verified evidence. No live price or decision is substituted.</p><a href="./lab/#/lab/fresh-evidence">Open the offline Scenario Lab</a></div>';}
  finally{button.disabled=false;button.textContent='Refresh live evidence';}
});
