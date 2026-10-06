import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
let filesScanned=0,secretNameFindings=0,authenticationHeaderFindings=0;
function scan(path){
  if(statSync(path).isDirectory()){for(const name of readdirSync(path))scan(join(path,name));return;}
  const text=readFileSync(path,'utf8');filesScanned++;
  if(/BINANCE_API_KEY|BINANCE_SECRET_KEY/.test(text))secretNameFindings++;
  if(/X-OC-(?:APIKEY|SIGN|NONCE)|authorization\s*["']?\s*[:=]\s*["']?(?:Bearer|Basic)\s+[A-Za-z0-9+/=._-]+/i.test(text))authenticationHeaderFindings++;
}
for(const path of process.argv.slice(2))scan(path);
console.log(JSON.stringify({filesScanned,secretNameFindings,authenticationHeaderFindings}));
if(secretNameFindings||authenticationHeaderFindings)process.exitCode=1;
