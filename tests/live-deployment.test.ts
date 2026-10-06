import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { deploymentConfiguration, validCredential } from "../src/lib/deployment";
import { previewMode } from "../src/lib/preview-mode";
import { allowedEvidenceRequest, allowedLiveQuery } from "../src/lib/binance/request-policy";
import { ApiError, rwaGet } from "../src/lib/binance/client";
import { boundedJson } from "../src/lib/binance/bounded-json";
import { evidenceCache } from "../src/lib/competition/cache";
import { healthResponse } from "../src/lib/health";
import { loadCompetition } from "../src/lib/competition/load";
import { observeCompetition } from "../src/lib/competition/observe";
import { createEvidenceReceipt } from "../src/lib/competition/receipt";
import { mvpContract } from "../src/lib/binance/schemas";

const names=["NODE_ENV","RENDER","VERCEL","VERCEL_ENV","AFTERCLOSE_DEPLOYMENT_MODE","AFTERCLOSE_PREVIEW_MODE","BINANCE_API_KEY","BINANCE_SECRET_KEY","BINANCE_WEB3_BASE_URL"];
async function isolated(run:()=>Promise<void>){
  const saved=names.map(n=>process.env[n]), original=globalThis.fetch;
  names.forEach(n=>delete process.env[n]);
  Object.assign(process.env,{NODE_ENV:"production",AFTERCLOSE_DEPLOYMENT_MODE:"competition-live",BINANCE_API_KEY:"test-only-key",BINANCE_SECRET_KEY:"test-only-secret"});
  try{await run();}finally{globalThis.fetch=original;names.forEach((n,i)=>{if(saved[i]===undefined)delete process.env[n];else process.env[n]=saved[i];});}
}
for(const mode of [undefined,"","live","COMPETITION-LIVE","https://evil.invalid"]){
  test(`production rejects deployment mode ${String(mode)}`,async()=>isolated(async()=>{
    if(mode===undefined)delete process.env.AFTERCLOSE_DEPLOYMENT_MODE;else process.env.AFTERCLOSE_DEPLOYMENT_MODE=mode;
    let calls=0;globalThis.fetch=async()=>{calls++;throw Error("forbidden");};
    assert.equal(deploymentConfiguration().liveAllowed,false);assert.equal(previewMode(),"live");
    const v=await loadCompetition();assert.equal(v.current.receipt.evidenceStatus,"UNAVAILABLE");assert.equal(v.current.receipt.observation.failure,"configuration");assert.equal(calls,0);
  }));
}
test("explicit modes and conflicts cannot silently substitute synthetic evidence",()=>{
  assert.equal(deploymentConfiguration({NODE_ENV:"production",AFTERCLOSE_DEPLOYMENT_MODE:"competition-live"}).liveAllowed,true);
  assert.equal(deploymentConfiguration({NODE_ENV:"production",AFTERCLOSE_DEPLOYMENT_MODE:"synthetic"}).liveAllowed,false);
  const env={NODE_ENV:"production" as const,AFTERCLOSE_DEPLOYMENT_MODE:"competition-live",AFTERCLOSE_PREVIEW_MODE:"synthetic"};
  assert.equal(deploymentConfiguration(env).reason,"CONFLICTING_MODES");assert.equal(previewMode(env),"live");
});
test("credential syntax fails closed before provider and issuer calls",async()=>isolated(async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;throw Error("forbidden");};
  for(const value of [undefined,"","short","bad value","line\nbreak","x".repeat(513)]){
    assert.equal(validCredential(value),false);if(value===undefined)delete process.env.BINANCE_API_KEY;else process.env.BINANCE_API_KEY=value;
    const o=await observeCompetition();assert.equal(o.state,"unavailable");assert.equal(o.quote,null);assert.equal(o.failure,"setup");
  }assert.equal(calls,0);
}));
test("health readiness is safe, uncached, and never requests provider data",async()=>isolated(async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;throw Error("forbidden");};
  const response=healthResponse(new Request("https://afterclose.invalid/api/health"));
  assert.equal(response.status,200);assert.equal(response.headers.get("Cache-Control"),"no-store");
  const body=await response.text();assert.doesNotMatch(body,/test-only|BINANCE|X-OC|stack/);
  delete process.env.BINANCE_SECRET_KEY;assert.equal(healthResponse(new Request("https://afterclose.invalid/api/health")).status,503);
  assert.equal(healthResponse(new Request("https://afterclose.invalid/api/health?url=evil")).status,400);assert.equal(calls,0);
}));
test("fixed endpoint and parameter shapes reject arbitrary proxy input",async()=>isolated(async()=>{
  let calls=0;globalThis.fetch=async()=>{calls++;throw Error("forbidden");};
  for(const [endpoint,params] of [["https://evil.invalid",{}],["../wallet/send",{}],["platforms",{url:"http://169.254.169.254"}],["search",{keyword:"AAPL"}],["tokens",{binanceChainId:"1"}],["price",{binanceChainId:"56",tokenContractAddresses:"0xdead"}],["platforms",{method:"POST"}],["__proto__",{}]] as const){
    assert.equal(allowedEvidenceRequest(endpoint,params),false);
    await assert.rejects(rwaGet(endpoint as "platforms",params as Record<string,string>,z.unknown()),(e:ApiError)=>e.kind==="configuration");
  }
  assert.equal(allowedEvidenceRequest("platforms",Object.create({url:"evil"})),false);
  assert.equal(allowedEvidenceRequest("platforms",[]),false);
  assert.equal(allowedEvidenceRequest("price",{binanceChainId:"56",tokenContractAddresses:mvpContract}),true);
  for(const query of [{url:"evil"},{mode:"live"},{_rsc:["a","b"]},{_rsc:"x".repeat(129)}])assert.equal(allowedLiveQuery(query),false);
  assert.equal(allowedLiveQuery({_rsc:"a_1-b"}),true);assert.equal(calls,0);
}));
test("100 concurrent visitors coalesce and cached clocks are never rewritten",async()=>{
  let clock=1000,calls=0;const load=evidenceCache(async()=>{calls++;await Promise.resolve();return{observedAt:clock,failed:false};},v=>v.failed,()=>clock);
  const all=await Promise.all(Array.from({length:100},()=>load()));assert.equal(calls,1);assert.ok(all.every(v=>v===all[0]));
  clock+=29999;assert.equal((await load()).observedAt,1000);assert.equal(calls,1);clock++;await load();assert.equal(calls,2);
});
test("failed captures impose a shared sixty second cooldown",async()=>{
  let clock=0,calls=0;const load=evidenceCache(async()=>{calls++;return false;},v=>!v,()=>clock);
  await load();clock=59999;await load();assert.equal(calls,1);clock=60000;await load();assert.equal(calls,2);
});
for(const failure of ["timeout","dns","tls","401","403","429","500","malformed-json","provider-code","schema"]){
  test(`provider failure ${failure} becomes sanitized unavailable evidence`,async()=>isolated(async()=>{
    globalThis.fetch=async(input)=>{
      if(String(input).includes("ondo.finance"))return new Response("",{status:503});
      if(failure==="timeout")throw new DOMException("test-only-secret","TimeoutError");
      if(failure==="dns"||failure==="tls")throw new TypeError("test-only-secret",{cause:{code:failure==="dns"?"ENOTFOUND":"CERT_HAS_EXPIRED"}});
      if(/^\d+$/.test(failure))return Response.json({msg:"test-only-secret"},{status:Number(failure)});
      if(failure==="malformed-json")return new Response("test-only-secret not JSON");
      return Response.json({code:failure==="provider-code"?12:0,success:true,data:"schema changed",msg:"test-only-secret"});
    };
    const o=await observeCompetition(), r=createEvidenceReceipt(o,Date.now());
    assert.equal(o.state,"unavailable");assert.equal(r.receipt.engine.result.decision,"WAIT");assert.equal(r.receipt.evidenceStatus,"UNAVAILABLE");assert.doesNotMatch(JSON.stringify(r),/test-only-secret|stack|X-OC/);
  }));
}
test("provider reflection and oversized JSON do not cross the serialization boundary",async()=>isolated(async()=>{
  globalThis.fetch=async()=>Response.json({code:0,success:true,data:{label:"test-only-secret"}});
  await assert.rejects(rwaGet("platforms",{},z.object({label:z.string()})),(e:ApiError)=>e.kind==="provider");
  await assert.rejects(boundedJson(new Response("x".repeat(2_000_001),{headers:{"content-length":"2000001"}})));
}));
for(const failure of ["missing-price","missing-time","stale","partial-success"]){
  test(`incomplete provider evidence ${failure} never earns a live review`,async()=>isolated(async()=>{
    const now=Date.now(), identity={binanceChainId:"56",platformId:"ondo",tokenContractAddress:mvpContract};
    const token={...identity,assetType:1,tokenSymbol:"NVDAon",tokenName:"NVIDIA (Ondo)",underlyingTicker:"NVDA",underlyingName:"NVIDIA",decimals:"18"};
    const quote={...identity,tokenPrice:failure==="missing-price"?null:"240",tokenPriceUpdatedAt:failure==="missing-time"?null:now-(failure==="stale"?90000:1000)};
    const data:Record<string,unknown>={platforms:[{platformId:"ondo",chainDistribution:[{binanceChainId:"56",tokenCount:1}]}],tokens:[token],search:[{ticker:"NVDA",companyName:"Nvidia Corp",assets:[token]}],chain:[{binanceChainId:"56",name:"BSC"}],price:[quote],"underlying-market":identity};
    globalThis.fetch=async(input)=>{
      const url=new URL(String(input));if(url.hostname==="app.ondo.finance")return new Response("",{status:503});
      const endpoint=url.pathname.split("/").at(-1)!;
      if(failure==="partial-success"&&endpoint==="underlying-market")return new Response("",{status:503});
      return Response.json({code:0,success:true,data:data[endpoint],timestamp:now});
    };
    const o=await observeCompetition(),r=createEvidenceReceipt(o,Date.now()).receipt;
    assert.equal(o.audits.length,6);assert.equal(r.engine.result.decision,"WAIT");
    assert.notEqual(r.freshness.status,"LIVE");
    assert.equal(r.freshness.status,failure==="stale"?"STALE":"UNAVAILABLE");
    if(failure==="partial-success")assert.equal(o.state,"unavailable");
  }));
}
