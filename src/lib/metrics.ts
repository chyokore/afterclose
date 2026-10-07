import "server-only";
import { AsyncLocalStorage } from "node:async_hooks";
export type Metrics = Record<string, number>;
const scope = new AsyncLocalStorage<Metrics>();
export function withMetrics<T>(metrics: Metrics, run: () => T): T { return scope.run(metrics, run); }
export function recordTiming(name: string, ms: number) { const m=scope.getStore(); if(m)m[name]=(m[name]??0)+ms; }
export function measure<T>(name: string, run: () => T): T {
  if(!scope.getStore())return run();
  const start=performance.now();try{return run();}finally{recordTiming(name,performance.now()-start);}
}
