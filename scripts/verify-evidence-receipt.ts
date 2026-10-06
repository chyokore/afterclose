import { readFile } from "node:fs/promises";
import { canonicalize, digestOf, verifyReceipt } from "../src/lib/competition/receipt";
async function main() {
  const path=process.argv[2];
  if(!path) throw new Error("Provide a receipt JSON file and optionally an expected SHA-256 digest.");
  const text=await readFile(path,"utf8");if(Buffer.byteLength(text)>256000)throw new Error("Receipt exceeds size limit.");
  const raw=JSON.parse(text);
  const envelope=raw.receipt ? raw : {receipt:raw,canonicalJson:canonicalize(raw),digest:digestOf(raw)};
  const verified=verifyReceipt(envelope);
  if(!verified || (process.argv[3] && verified.digest!==process.argv[3])) throw new Error("Receipt verification failed.");
  console.log(JSON.stringify({verified:true,digest:verified.digest,evaluationId:verified.receipt.evaluationId,decision:verified.receipt.engine.result.decision,notice:"Integrity and deterministic reproduction only; this is not a provider signature or proof of authenticity."}));
}
main().catch(()=>{console.error("Receipt verification failed. Check the file, schema, engine version and expected digest.");process.exitCode=1;});
