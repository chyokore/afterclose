import "server-only";
import { deploymentConfiguration } from "./deployment";
import { credentialsConfigured } from "./binance/client";
import { BUILD_INFO } from "./build-info";
export function healthResponse(request:Request) {
  if(new URL(request.url).search) return Response.json({status:"invalid-request"},{status:400,headers:{"Cache-Control":"no-store"}});
  const config=deploymentConfiguration();
  const ready=config.mode==="synthetic" || config.liveAllowed && credentialsConfigured();
  return Response.json({application:"afterclose",status:ready?"ready":"unavailable",mode:config.mode,build:BUILD_INFO,serverTime:new Date().toISOString()},{status:ready?200:503,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
