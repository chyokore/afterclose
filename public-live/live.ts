import type { GatewayResponse } from '../gateway/contract';
import {canonicalJson, createLiveSession, verifyDigest} from './session';
declare const PUBLIC_GATEWAY_URL:string;
declare const RELEASE_COMMIT:string;
if(location.hash.startsWith('#/lab/'))location.replace('./lab/'+location.hash);
const session=createLiveSession(sessionStorage,fetch,Date.now,PUBLIC_GATEWAY_URL);
let current:GatewayResponse|null=null;
const escape=(v:unknown)=>String(v??'Unavailable').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const time=(v:number|null|undefined)=>v==null?'Unavailable':new Date(v).toISOString();
const age=(v:number|null|undefined)=>v==null?'Unavailable':`${(v/1000).toFixed(1)} seconds`;
const status=document.querySelector<HTMLElement>('#status')!;
const evidence=document.querySelector<HTMLElement>('#evidence')!;
const button=document.querySelector<HTMLButtonElement>('#refresh')!;
let evaluationAt:number|null=null;
document.querySelector('#release')!.textContent=RELEASE_COMMIT;
function refreshState(){button.disabled=session.loading()||session.remainingMs()>0;document.querySelector('#cooldown')!.textContent=session.loading()?'One request in progress.':session.remainingMs()>0?`Refresh available in ${Math.ceil(session.remainingMs()/1000)} seconds. No automatic retries.`:'Manual refresh only. No polling.';}
refreshState();
setInterval(()=>{refreshState();const clock=document.querySelector('#elapsed');if(clock&&evaluationAt!==null)clock.textContent=`${Math.max(0,(Date.now()-evaluationAt)/1000).toFixed(0)} seconds since this evaluation. Receipt clocks below are fixed; refresh to reclassify.`;},1000);
button.addEventListener('click',async()=>{
  button.disabled=true;evidence.replaceChildren();evaluationAt=null;current=null;status.textContent='Fetching current Binance Web3 evidence…';
  try{
    const body=await session.refresh();
    const r=body.receipt;current=body;
    evaluationAt=r.evaluatedAtMs;
    status.textContent=`Binance observation received · ${r.freshness.status} at evaluation · receipt digest verified`;
    const price=r.fields.find(f=>f.id==='token-price');
    evidence.innerHTML=`<div class="card"><h2>Ondo NVDAon</h2><p>BNB Smart Chain · chain ID ${escape(r.asset?.chain)}</p><p>Contract: <code>${escape(r.asset?.contract)}</code></p><p>Discovery: ${escape(r.discovery)} · Provenance: Binance Web3 RWA; provider-reported token evidence.</p></div><div class="grid"><div class="card"><p class="label">Evidence completeness</p><div class="value">${escape(r.evidenceStatus)}</div><p>Independent NVDA reference unavailable</p></div><div class="card"><p class="label">Canonical verdict</p><div class="value wait">${escape(r.engine.result.decision)}</div><p>No execution authorization</p></div><div class="card"><p class="label">NVDAon · USD per token</p><div class="value">${escape(price?.raw)}</div><p>${escape(r.freshness.status)} at evaluation</p></div></div>
    <div class="card"><h2>Clocks that do not reset</h2><p id="elapsed" class="clock">Evaluation just received. Receipt clocks remain fixed.</p><dl><dt>Provider price time</dt><dd>${escape(time(price?.providerAtMs))}</dd><dt>AfterClose observed</dt><dd>${escape(time(price?.observedAtMs))}</dd><dt>Evaluated</dt><dd>${escape(time(r.evaluatedAtMs))}</dd><dt>Provider age at evaluation</dt><dd>${escape(age(price?.providerDataAgeMs))}</dd><dt>Observation age at evaluation</dt><dd>${escape(age(price?.observationAgeMs))}</dd></dl><p class="clock">An instance may reuse evidence for 30 seconds. Metadata keeps its original observation time. Browser refresh does not create a new provider timestamp.</p></div>
    <div class="card"><h2>Why AfterClose waits</h2><ul>${r.engine.result.findings.filter(f=>f.severity==='blocking').map(f=>`<li><strong>${escape(f.code)}</strong>: ${escape(f.message)}</li>`).join('')}</ul><dl><dt>Independent reference</dt><dd>${escape(r.independentReference.reason)}</dd><dt>Multiplier</dt><dd>${escape(r.multiplier.status)} — no confirmed effective date or validity interval</dd><dt>Authoritative session</dt><dd>${escape(r.session.authoritative)}</dd><dt>Execution evidence</dt><dd>${escape(r.execution.simulation)}</dd></dl></div>
    <details><summary>Inspect evidence receipt and digest</summary><p id="receipt-status">SHA-256 content integrity verified in this browser. This does not independently rerun the engine or authenticate the provider.</p><code id="receipt-digest">${escape(body.receiptDigest)}</code><div class="actions"><button id="copy-digest">Copy SHA-256</button><button id="verify-receipt">Verify digest again</button><button id="download-receipt">Download receipt</button></div><p id="copy-status" role="status"></p><p>For canonical engine reproduction, run the repository verifier against the downloaded receipt and displayed digest.</p><p class="clock">Engine ${escape(r.engine.id)}<br>Build ${escape(body.build.commit)} · source ${escape(body.build.sourceDigest)} · dirty ${escape(body.build.dirty)}</p><pre>${escape(JSON.stringify(r,null,2))}</pre></details><div class="card"><h2>What would complete evidence change?</h2><p>Explore the explicitly fictional complete-evidence case in Scenario Lab.</p><a href="./lab/#/lab/fresh-evidence">Open Scenario Lab →</a></div>`;
    document.querySelector('#copy-digest')!.addEventListener('click',async()=>{
      try {
        // Synchronous copy preserves the user gesture in embedded browsers.
        const field=document.createElement('textarea');field.value=body.receiptDigest;
        field.setAttribute('aria-label','Digest to copy');document.body.append(field);field.select();
        let copied=false;try{copied=document.execCommand('copy');}finally{field.remove();}
        if(!copied)await navigator.clipboard.writeText(body.receiptDigest);
        document.querySelector('#copy-status')!.textContent='SHA-256 copied.';
      }catch{document.querySelector('#copy-status')!.textContent='Clipboard unavailable. Select and copy the displayed digest.';}
    });
    document.querySelector('#verify-receipt')!.addEventListener('click',async()=>{try{await verifyDigest(body);document.querySelector('#receipt-status')!.textContent='PASS · SHA-256 content integrity verified again in this browser. Engine reproduction uses the repository verifier.';}catch{document.querySelector('#receipt-status')!.textContent='FAIL · receipt integrity could not be verified.';}});
    document.querySelector('#download-receipt')!.addEventListener('click',()=>{if(!current)return;const envelope={receipt:current.receipt,canonicalJson:canonicalJson(current.receipt),digest:current.receiptDigest};const url=URL.createObjectURL(new Blob([JSON.stringify(envelope,null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='afterclose-evidence-receipt.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  }catch{status.textContent='LIVE EVIDENCE TEMPORARILY UNAVAILABLE';evidence.innerHTML='<div class="card error"><h2>Live evidence unavailable</h2><p>The gateway or provider could not supply verified evidence. No live price or decision is substituted.</p><a href="./lab/#/lab/fresh-evidence">Open the offline Scenario Lab</a></div>';}
  finally{button.textContent='Refresh Live Evidence';refreshState();}
});
