import {createServer} from 'node:http';
import {readFileSync,statSync} from 'node:fs';
import {resolve,extname,sep} from 'node:path';
export function staticServer(root=resolve('static-preview/dist')) {
  return createServer((req,res)=>{
    let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);res.end('Malformed path');return;}
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);res.end();return;}
    // Also serve under a project prefix to rehearse GitHub Pages relative assets.
    if(pathname.startsWith('/afterclose/'))pathname=pathname.slice('/afterclose'.length);
    const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    let body,status=200,target=file;
    try{if(!statSync(file).isFile())throw new Error('not file');body=readFileSync(file);}catch{target=resolve(root,'404.html');body=readFileSync(target);status=404;}
    const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'}[extname(target)]??'text/plain';
    res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
  });
}
if(process.argv[1]?.endsWith('serve-static-preview.mjs')){const server=staticServer();server.listen(3190,'127.0.0.1',()=>console.log('Static files only: http://127.0.0.1:3190'));}
