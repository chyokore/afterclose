import { competitionOperations } from "../src/lib/competition/observe";
import type { ResponseAudit } from "../src/lib/binance/client";
type Observer=(audit:ResponseAudit)=>void;
export const METADATA_TTL={discovery:300_000,platformsAndChains:3_600_000,issuer:300_000} as const;
// Retain the original response audit with each metadata value. TTL is admission
// policy, not a claim that a provider supplied a metadata effective timestamp.
function memo<T>(read:(observer?:Observer)=>Promise<T>,ttl:number,clock:()=>number){
  let entry:{value:T;audits:ResponseAudit[];expires:number}|undefined;
  return async(observer?:Observer)=>{
    if(entry&&clock()<entry.expires){entry.audits.forEach(a=>observer?.({...a}));return entry.value;}
    const audits:ResponseAudit[]=[];
    const value=await read(a=>{audits.push({...a});observer?.(a);});
    entry={value,audits,expires:clock()+ttl};return value;
  };
}
export function cachedOperations(source=competitionOperations,clock=Date.now):typeof competitionOperations {
  const discoverySearch=memo(observer=>source.search("NVDA",observer),METADATA_TTL.discovery,clock);
  return {
    platforms:memo(source.platforms,METADATA_TTL.platformsAndChains,clock),
    tokens:memo(source.tokens,METADATA_TTL.discovery,clock),
    search:(keyword,observer)=>{if(keyword!=="NVDA")throw Error("Unsupported gateway discovery");return discoverySearch(observer);},
    chains:memo(source.chains,METADATA_TTL.platformsAndChains,clock),
    issuer:memo(()=>source.issuer(),METADATA_TTL.issuer,clock),
    prices:source.prices,underlyingMarket:source.underlyingMarket,
  };
}
