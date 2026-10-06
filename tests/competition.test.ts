import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { classifyFreshness } from "../src/lib/competition/freshness";
import { discoverNvda, endpointOrder, type LiveObservation } from "../src/lib/competition/model";
import { canonicalize, createEvidenceReceipt, digestOf, eligibleSnapshot, ENGINE_ID, snapshotView, verifyReceipt } from "../src/lib/competition/receipt";
import { snapshotStore } from "../src/lib/competition/snapshot";
import { observeCompetition } from "../src/lib/competition/observe";
import { mvpContract } from "../src/lib/binance/schemas";

// Deterministic test doubles ONLY. These are never loaded by application code or saved
// in the application's snapshot directory. mode=live exercises the transport boundary.
const now = Date.parse("2026-10-06T13:00:00Z");
function fixture(): LiveObservation {
  const identity = { binanceChainId: "56" as const, platformId: "ondo", tokenContractAddress: mvpContract };
  return { mode: "live", state: "connected", failure: null, discovery: "MATCH", searchCompany: "Nvidia Corp",
    token: { ...identity, assetType: 1, tokenSymbol: "NVDAon", tokenName: "NVIDIA (Ondo)", underlyingName: "NVIDIA", underlyingTicker: "NVDA", decimals: "18", tokenToShareRatio: "1.01" },
    quote: { ...identity, tokenPrice: "240.123456789123456789", tokenPriceUpdatedAt: now - 1000, referencePrice: "237" },
    market: { ...identity, marketData: { referencePrice: "237" }, statusInfo: { marketStatus: "OPEN", openState: true } },
    chains: [{ binanceChainId: "56", name: "BSC" }],
    audits: endpointOrder.map(endpoint => ({ endpoint, status: 200, code: "0", latencyMs: 20, responseTimestamp: now - 200, observedAtMs: now - 100 })),
    issuer: { availability: "reported", value: "1.01", observedAtMs: now - 100, source: "https://app.ondo.finance/assets/nvdaon", effectiveAtMs: null, validUntilMs: null, verification: "unverified" } };
}
for (const [age, observationAge, expected] of [[60_000, 30_000, "LIVE"], [60_001, 0, "STALE"], [30_001, 30_001, "STALE"], [86_399_999, 0, "STALE"], [86_400_000, 0, "HISTORICAL"]] as const) {
  test(`freshness boundaries: provider ${age}, observation ${observationAge}`, () => assert.equal(classifyFreshness(true, now-age, now-observationAge, now).status, expected));
}
test("absent, future and reversed clocks never borrow observation time", () => {
  for (const [p,o] of [[null,now],[now,null],[now+1,now],[now,now-1],[NaN,now],[-1,now]]) assert.equal(classifyFreshness(true,p,o,now).status,"UNAVAILABLE");
  assert.equal(classifyFreshness(false,now,now,now).status,"UNAVAILABLE");
  assert.equal(classifyFreshness(true,now,now,NaN).status,"UNAVAILABLE");
});
test("freshness policy is evidence specific", () => {
  assert.equal(classifyFreshness(true,now-3600_000,now,now,"multiplier").status,"LIVE");
  for (const type of ["token","equity","session"] as const) assert.equal(classifyFreshness(true,now-3600_000,now,now,type).status,"STALE");
  assert.equal(classifyFreshness(true,now-7*86_400_000,now,now,"multiplier").status,"HISTORICAL");
});
test("discovery searches identity before comparing historical address", () => {
  const token = fixture().token!;
  const platforms = [{ platformId: "ondo", chainDistribution: [{ binanceChainId: "56", tokenCount: 1 }] }];
  const matches = (t: typeof token) => [{ ticker:"NVDA",companyName:"Nvidia Corp",assets:[t] }];
  assert.equal(discoverNvda([token],platforms,matches(token)).discovery,"MATCH");
  const changed = {...token,tokenContractAddress:`0x${"1".repeat(40)}`};
  assert.equal(discoverNvda([changed],platforms,matches(changed)).discovery,"CHANGED");
  assert.equal(discoverNvda([token,token],platforms,matches(token)).discovery,"UNVERIFIED");
  assert.equal(discoverNvda([token],platforms,[]).discovery,"UNVERIFIED");
  assert.equal(discoverNvda([{...token,decimals:null}],platforms,matches(token)).discovery,"UNVERIFIED");
});
test("receipt preserves both clocks, exact decimal, exclusions and canonical engine WAIT", () => {
  const e = createEvidenceReceipt(fixture(),now), r = e.receipt;
  assert.equal(r.freshness.status,"LIVE"); assert.equal(r.evidenceStatus,"PARTIAL");
  assert.equal(r.fields[0].raw,"240.123456789123456789");
  assert.equal(r.fields[0].providerAtMs,now-1000); assert.equal(r.fields[0].observedAtMs,now-100);
  assert.equal(r.fields[0].providerDataAgeMs,1000); assert.equal(r.fields[0].observationAgeMs,100);
  assert.equal(r.engine.input.tokenPrice?.priceAt?.unixMs,now-1000);
  assert.equal(r.engine.input.tokenPrice?.observedAt?.unixMs,now-100);
  for (const f of r.fields.filter(f => ["ratio","issuer-multiplier","price-reference","market-reference","market-status"].includes(f.id))) { assert.equal(f.usedByEngine,false); assert.equal(f.providerAtMs,null); }
  assert.equal(r.multiplier.normalizedTokenPrice,null); assert.equal(r.independentReference.status,"UNAVAILABLE");
  assert.equal(r.session.authoritative,"UNKNOWN"); assert.equal(r.engine.result.decision,"WAIT");
  assert.ok(r.engine.blockerCodes.length>0); assert.equal(r.execution.simulation,"NOT_RUN");
});
test("canonical object ordering is deterministic and unsafe JSON rejected", () => {
  assert.equal(canonicalize({b:2,a:{z:0,x:1}}),canonicalize({a:{x:1,z:0},b:2}));
  for (const v of [undefined,NaN,Infinity,new Date(),{x:undefined}]) assert.throws(()=>canonicalize(v));
  assert.equal(digestOf({b:2,a:1}), createHash("sha256").update('{"a":1,"b":2}').digest("hex"));
});
test("same evidence, including reordered input keys, yields same receipt", () => {
  const f=fixture(), a=createEvidenceReceipt(f,now), b=createEvidenceReceipt(Object.fromEntries(Object.entries(f).reverse()),now);
  assert.deepEqual(a,b); assert.equal(verifyReceipt(a)?.digest,a.digest);
});
test("meaningful evidence mutations change digest and invalidate existing envelope", () => {
  const a=createEvidenceReceipt(fixture(),now);
  for (const change of [
    (f:LiveObservation)=>{f.quote!.tokenPrice="241";},
    (f:LiveObservation)=>{f.quote!.tokenPriceUpdatedAt!--;},
    (f:LiveObservation)=>{f.audits[0].observedAtMs!--;},
    (f:LiveObservation)=>{f.issuer.value="1.02";},
    (f:LiveObservation)=>{f.discovery="CHANGED";},
  ]) { const f=fixture();change(f);assert.notEqual(createEvidenceReceipt(f,now).digest,a.digest); }
  const tampered=structuredClone(a);tampered.receipt.engine.result.decision="PROCEED_TO_REVIEW";
  assert.equal(verifyReceipt(tampered),null);
  assert.equal(verifyReceipt({...a,digest:"0".repeat(64)}),null);
  assert.notEqual(createEvidenceReceipt(fixture(),now+1).digest,a.digest);
});
test("engine identifier matches exact unchanged engine source", async () => {
  assert.equal(ENGINE_ID.split(":")[1],createHash("sha256").update((await readFile("src/lib/reference-truth/engine.ts","utf8")).replaceAll("\r\n","\n")).digest("hex"));
});
test("synthetic mode cannot enter receipt; extra transport properties are stripped", () => {
  assert.throws(()=>createEvidenceReceipt({...fixture(),mode:"synthetic"},now));
  assert.throws(()=>createEvidenceReceipt(fixture(),-1));
  const e=createEvidenceReceipt({...fixture(),headers:{authorization:"TEST_ONLY_DO_NOT_KEEP"}},now);
  assert.ok(!e.canonicalJson.includes("TEST_ONLY_DO_NOT_KEEP"));
  const tampered={...e,receipt:{...e.receipt,extra:"unrecognized"}};
  assert.equal(verifyReceipt(tampered),null);
});
test("forged match flag, changed asset and inconsistent endpoint identities fail closed", () => {
  for (const change of [
    (f:LiveObservation)=>{f.token!.tokenContractAddress=`0x${"2".repeat(40)}`;},
    (f:LiveObservation)=>{f.token!.underlyingTicker="OTHER";},
    (f:LiveObservation)=>{f.quote!.platformId="other";},
    (f:LiveObservation)=>{f.discovery="CHANGED";},
    (f:LiveObservation)=>{f.chains=[];},
    (f:LiveObservation)=>{f.audits.pop();},
    (f:LiveObservation)=>{f.audits[0].code="401";},
    (f:LiveObservation)=>{f.audits[0].observedAtMs=now+1;},
  ]) {const f=fixture();change(f);const e=createEvidenceReceipt(f,now);assert.equal(e.receipt.transportVerified,false);assert.equal(e.receipt.engine.result.decision,"WAIT");assert.equal(eligibleSnapshot(e),false);}
  const f=fixture();f.audits[1]=f.audits[0];assert.throws(()=>createEvidenceReceipt(f,now));
});
test("undated and historical prices are never relabeled by fresh HTTP observation", () => {
  const f=fixture(); f.quote!.tokenPriceUpdatedAt=null;
  assert.equal(createEvidenceReceipt(f,now).receipt.freshness.status,"UNAVAILABLE");
  f.quote!.tokenPriceUpdatedAt=now-2*86_400_000;
  const r=createEvidenceReceipt(f,now);assert.equal(r.receipt.freshness.status,"HISTORICAL");assert.equal(r.receipt.engine.result.decision,"WAIT");
  const view=snapshotView(createEvidenceReceipt(fixture(),now),now+1000);
  assert.equal(view.status,"HISTORICAL");assert.equal(view.capturedAtMs,now);assert.equal(view.ageMs,1000);
});
test("snapshot persistence validates integrity, retains last success through outage and rejects rollback", async () => {
  const directory=await mkdtemp(join(tmpdir(),"afterclose-receipt-test-"));
  try {
    const store=snapshotStore(directory), a=createEvidenceReceipt(fixture(),now), b=createEvidenceReceipt(fixture(),now+1);
    assert.equal(await store.read(),null);
    await Promise.all([store.save(b),store.save(a)]);
    assert.equal((await store.read())?.digest,b.digest);
    const failure={...fixture(),state:"unavailable" as const,failure:"network" as const,quote:null};
    assert.equal(await store.save(createEvidenceReceipt(failure,now+2)),false);
    assert.equal((await store.read())?.digest,b.digest);
    await writeFile(join(directory,"last-verified.json"),JSON.stringify({...a,digest:"bad"}));
    assert.equal(await store.read(),null);
    await writeFile(join(directory,"last-verified.json"),"x".repeat(256001));assert.equal(await store.read(),null);
  } finally {
    assert.ok(resolve(directory).startsWith(resolve(tmpdir())+sep));
    await rm(directory,{recursive:true,force:true});
  }
});
test("synthetic guard blocks provider and snapshot access before network or filesystem", async () => {
  const oldMode=process.env.AFTERCLOSE_PREVIEW_MODE, oldFetch=globalThis.fetch;
  let requests=0;
  try { process.env.AFTERCLOSE_PREVIEW_MODE="synthetic";globalThis.fetch=async()=>{requests++;throw new Error("not allowed");};
    await assert.rejects(observeCompetition()); await assert.rejects(snapshotStore().read());
    assert.throws(()=>snapshotStore().save(createEvidenceReceipt(fixture(),now))); assert.equal(requests,0);
  } finally { globalThis.fetch=oldFetch;if(oldMode===undefined)delete process.env.AFTERCLOSE_PREVIEW_MODE;else process.env.AFTERCLOSE_PREVIEW_MODE=oldMode; }
});
test("mocked integration: six genuine adapter paths, response audits and outage isolation", async () => {
  const originalFetch=globalThis.fetch;
  const names=["BINANCE_API_KEY","BINANCE_SECRET_KEY","BINANCE_WEB3_BASE_URL","AFTERCLOSE_PREVIEW_MODE"];
  const previous=names.map(n=>process.env[n]);
  const f=fixture(), requested:string[]=[];
  try {
    process.env.BINANCE_API_KEY="test-only-key";process.env.BINANCE_SECRET_KEY="test-only-secret";
    delete process.env.BINANCE_WEB3_BASE_URL;delete process.env.AFTERCLOSE_PREVIEW_MODE;
    globalThis.fetch=async(input,init)=>{
      const url=new URL(String(input));requested.push(url.pathname);
      if(url.hostname==="app.ondo.finance") {assert.equal(new Headers(init?.headers).get("X-OC-APIKEY"),null);return new Response("",{status:503});}
      assert.equal(url.hostname,"web3.binance.com");assert.equal(init?.method,"GET");assert.equal(init?.redirect,"error");
      const name=url.pathname.split("/").at(-1)!;
      const data:Record<string,unknown>={platforms:[{platformId:"ondo",chainDistribution:[{binanceChainId:"56",tokenCount:1}]}],tokens:[f.token],search:[{ticker:"NVDA",companyName:"Nvidia Corp",assets:[f.token]}],chain:f.chains,price:[f.quote],"underlying-market":f.market};
      assert.ok(name in data);return Response.json({code:0,success:true,timestamp:now,data:data[name]});
    };
    const observation=await observeCompetition();
    assert.equal(observation.state,"connected");assert.equal(observation.discovery,"MATCH");
    assert.equal(observation.audits.length,6);assert.equal(requested.length,7);
    assert.ok(requested.includes("/build/api/v1/dex/aggregator/supported/chain"));
    assert.equal(observation.quote?.tokenPriceUpdatedAt,now-1000);
    assert.ok(observation.audits.every(a=>a.observedAtMs!>=now&&a.responseTimestamp===now));
    globalThis.fetch=async()=>{throw new TypeError("TEST_PRIVATE_TRANSPORT");};
    const failed=await observeCompetition();assert.equal(failed.state,"unavailable");assert.equal(failed.quote,null);
    assert.equal(failed.audits.length,4);assert.ok(!JSON.stringify(failed).includes("TEST_PRIVATE_TRANSPORT"));
    assert.equal(createEvidenceReceipt(failed,Date.now()).receipt.evidenceStatus,"UNAVAILABLE");
    delete process.env.BINANCE_API_KEY;let attempts=0;
    globalThis.fetch=async()=>{attempts++;throw new Error("must not fetch");};
    const missing=await observeCompetition();assert.equal(missing.failure,"setup");assert.equal(missing.issuer.observedAtMs,null);assert.equal(attempts,0);
  } finally {globalThis.fetch=originalFetch;names.forEach((name,i)=>{if(previous[i]===undefined)delete process.env[name];else process.env[name]=previous[i];});}
});
