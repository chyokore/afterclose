// Single process / single instance only. No visitor-controlled cache keys.
export function evidenceCache<T>(capture:()=>Promise<T>, failed:(v:T)=>boolean, clock=Date.now) {
  let cached:T|undefined, nextAllowed=0, inflight:Promise<T>|null=null;
  return async function load() {
    if(inflight)return inflight;
    if(cached!==undefined && clock()<nextAllowed)return cached;
    inflight=capture().then(value=>{cached=value;nextAllowed=clock()+(failed(value)?60_000:30_000);return value;}).finally(()=>{inflight=null;});
    return inflight;
  };
}
