// Test-only wrapper: the candidate entry and binding guard remain unchanged.
import candidate from './worker.mjs';
let calls=0;
globalThis.fetch=async()=>{calls++;console.error('AFTERCLOSE_EXTERNAL_FETCH_BLOCKED');throw new Error('External fetch forbidden');};
const rehearsalWorker = {async fetch(request,env,ctx){const response=await candidate.fetch(request,env,ctx);const headers=new Headers(response.headers);headers.set('x-rehearsal-external-fetches',String(calls));return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}};

export default rehearsalWorker;
