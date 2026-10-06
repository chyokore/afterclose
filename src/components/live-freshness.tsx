"use client";
import { useEffect, useState } from "react";
import { classifyFreshness } from "@/lib/competition/freshness";
export function LiveFreshness({evaluatedAtMs,providerAtMs,observedAtMs,available,connected}:{evaluatedAtMs:number;providerAtMs:number|null;observedAtMs:number|null;available:boolean;connected:boolean}) {
  const [elapsed,setElapsed]=useState(0);
  useEffect(()=>{const start=performance.now();const timer=setInterval(()=>setElapsed(Math.floor(performance.now()-start)),1000);return()=>clearInterval(timer);},[evaluatedAtMs]);
  const f=classifyFreshness(available,providerAtMs,observedAtMs,evaluatedAtMs+elapsed);
  const status=connected?(f.status==="LIVE"?"PARTIAL":f.status):"UNAVAILABLE";
  return <><p className="status" data-evidence-status={status}>Evidence status: {status}</p><p>Token evidence: <strong data-token-status={f.status}>{f.status}</strong>. {f.reason}</p><small>Age advances from the server evaluation. Receipt clocks remain unchanged.</small></>;
}
