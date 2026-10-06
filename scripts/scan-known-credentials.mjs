import nextEnv from '@next/env';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { resolve, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';
// Credentials are read solely for in-memory exact-value comparisons. Never emit values.
nextEnv.loadEnvConfig(process.cwd());
const values=['BINANCE_API_KEY','BINANCE_SECRET_KEY'].map(k=>process.env[k]).filter(v=>v&&v.length>=8).flatMap(v=>[Buffer.from(v),Buffer.from(v,'utf16le'),Buffer.from(encodeURIComponent(v)),Buffer.from(Buffer.from(v).toString('base64'))]);
if(values.length===0)throw new Error('No owner credential values available for exact-value scan.');
const files=new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8',windowsHide:true}).split('\0').filter(Boolean).map(f=>resolve(f)));
function walk(p){const s=lstatSync(p);if(s.isSymbolicLink())return;if(s.isDirectory())for(const e of readdirSync(p))walk(join(p,e));else files.add(resolve(p));}
for(const p of process.argv.slice(2))walk(p);
let scanned=0;const findings=[];
for(const file of files){if(/(?:^|[\\/])\.env(?:\.|$)/.test(file))continue;const bytes=readFileSync(file);scanned++;if(values.some(v=>bytes.includes(v)))findings.push(relative(process.cwd(),file));}
console.log(JSON.stringify({filesScanned:scanned,includesBinary:true,exactCredentialFindings:findings}));
if(findings.length)process.exitCode=1;
