import { mvpContract } from "./schemas";
const shapes: Record<string, Record<string, readonly string[]>> = {
  platforms: {}, tokens: { binanceChainId: ["56"] },
  search: { keyword: ["NVDA", mvpContract] },
  price: { binanceChainId: ["56"], tokenContractAddresses: [mvpContract] },
  "underlying-market": { binanceChainId: ["56"], tokenContractAddress: [mvpContract] },
  "chain-list": { binanceChainId: ["56"] },
};
export function allowedLiveQuery(params:Record<string,unknown>) {
  return Object.entries(params).every(([k,v])=>k==="_rsc" && typeof v==="string" && /^[A-Za-z0-9_-]{1,128}$/.test(v));
}
export function allowedEvidenceRequest(endpoint: string, params: unknown): params is Record<string, string> {
  if (!Object.hasOwn(shapes, endpoint) || !params || Object.getPrototypeOf(params) !== Object.prototype) return false;
  const shape=shapes[endpoint], p=params as Record<string,unknown>;
  return Object.keys(p).length === Object.keys(shape).length && Object.entries(shape).every(([key,values]) => typeof p[key] === "string" && values.includes(p[key] as string));
}
