// Local-only adapter for the exact prebuilt function and separate-origin static UI.
import nextEnv from '@next/env';
import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
if(process.argv.includes('--unavailable')){delete process.env.BINANCE_API_KEY;delete process.env.BINANCE_SECRET_KEY;}
else nextEnv.loadEnvConfig(process.cwd(),false,{info(){},error(){}});
process.env.NODE_ENV='development';process.env.AFTERCLOSE_DEPLOYMENT_MODE='competition-live';delete process.env.AFTERCLOSE_PREVIEW_MODE;
const {default:handler}=await import('../.tools/gateway-package/functions/live-evidence.mjs');
createServer(async(req,res)=>{try{const response=await handler(new Request(`http://127.0.0.1:4174${req.url}`,{method:req.method,headers:req.headers}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Gateway unavailable');}}).listen(4174,'127.0.0.1');
const root=resolve('.tools/gateway-preview');
createServer(async(req,res)=>{try{let path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(path!==root&&!path.startsWith(root+sep))throw Error();if((await stat(path)).isDirectory())path=resolve(path,'index.html');const body=await readFile(path);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css'}[extname(path)]??'application/octet-stream'),'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1');
console.log('Local frontend http://127.0.0.1:4173; gateway http://127.0.0.1:4174; no deployment.');
