import { measure, recordTiming } from "../metrics";
export async function boundedJson(response:Response) {
  const started=performance.now();
  const limit=2_000_000;
  if(Number(response.headers.get("content-length"))>limit || !response.body)throw new Error("Invalid response size");
  const reader=response.body.getReader(), decoder=new TextDecoder();let size=0,text="";
  try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new Error("Invalid response size");}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();}
  finally{reader.releaseLock();}
  recordTiming("binanceBodyReadMs",performance.now()-started);
  return measure("jsonParsingMs",()=>JSON.parse(text) as unknown);
}
