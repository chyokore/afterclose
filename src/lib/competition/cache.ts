// Single process / single instance only. No visitor-controlled cache keys.
export type CacheRead = { state: 'MISS' | 'HIT' | 'COALESCED' | 'FAILURE_COOLDOWN'; retryAfterMs: number };
export function evidenceCache<T>(capture:()=>Promise<T>, failed:(v:T)=>boolean, clock=Date.now, failureCooldownMs:(value:T)=>number=()=>60_000) {
  let cached:T|undefined, nextAllowed=0, inflight:Promise<T>|null=null;
  return async function load(report?:(read:CacheRead)=>void) {
    if(inflight){const value=await inflight;report?.({state:'COALESCED',retryAfterMs:failed(value)?Math.max(0,nextAllowed-clock()):0});return value;}
    if(cached!==undefined && clock()<nextAllowed){report?.({state:failed(cached)?'FAILURE_COOLDOWN':'HIT',retryAfterMs:failed(cached)?Math.max(0,nextAllowed-clock()):0});return cached;}
    inflight=capture().then(value=>{cached=value;nextAllowed=clock()+(failed(value)?Math.max(60_000,failureCooldownMs(value)):30_000);return value;}).finally(()=>{inflight=null;});
    const value=await inflight;report?.({state:'MISS',retryAfterMs:failed(value)?Math.max(0,nextAllowed-clock()):0});return value;
  };
}
