// Local-only deterministic UI QA. Never part of either deployable artifact.
import {createServer} from 'node:http';
import {readFile,appendFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('.tools/public-live-fixture/dist');
// Reproduce from committed, explicitly historical AfterClose evidence on a fresh clone.
const envelope=JSON.parse(await readFile('docs/deployment/public-live-production-receipt.json','utf8'));
const release=JSON.parse(await readFile('docs/deployment/public-live-evidence.json','utf8'));
const fixture={schemaVersion:'afterclose-live-gateway/v1',status:'LIVE_EVIDENCE',reason:null,
 receipt:envelope.receipt,receiptDigest:envelope.digest,build:release.production.health.body.build};
if(!fixture.receipt||!fixture.receiptDigest)throw Error('Committed historical QA receipt missing');
createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/api/live-evidence'){
   let mode='success';try{mode=(await readFile('.tools/public-live-fixture/mode.txt','utf8')).trim();}catch{}
   await appendFile('.tools/public-live-fixture/requests.jsonl',JSON.stringify({at:new Date().toISOString(),mode})+'\n');
   res.setHeader('Content-Type','application/json');res.setHeader('Cache-Control','no-store');
   if(mode==='failure'){res.writeHead(503);return res.end('{}');}
   if(mode==='rate-limit'){res.setHeader('Retry-After','120');res.writeHead(429);return res.end('{}');}
   const body=structuredClone(fixture);if(mode==='bad-digest')body.receiptDigest='0'.repeat(64);
   await new Promise(r=>setTimeout(r,1000));return res.end(JSON.stringify(body));
  }
  const file=resolve(root,'.'+decodeURIComponent(pathname)+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(root+sep))throw Error('Outside fixture');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(file)]||'application/octet-stream');
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(3192,'127.0.0.1',()=>console.log('Local QA fixture listening on 3192; no provider calls.'));
