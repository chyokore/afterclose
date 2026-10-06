import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const files = new Set(execFileSync('git', ['ls-files','--cached','--others','--exclude-standard','-z'], { encoding:'utf8' }).split('\0').filter(Boolean).map(f=>resolve(f)));
function walk(p){if(statSync(p).isDirectory()){for(const e of readdirSync(p))walk(join(p,e));}else files.add(resolve(p));}
for(const arg of process.argv.slice(2).filter(p=>p!=='--counts-only'))walk(arg);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}/,
  /(?:BINANCE_API_KEY|BINANCE_SECRET_KEY|PRIVATE_KEY|WALLET_PRIVATE_KEY|EQUITY_API_KEY)[ \t]*[:=][ \t]*["']?[A-Za-z0-9+\/_=-]{20,}/,
  /(?:sk_live_|sk_test_)[A-Za-z0-9]{20,}/,
];
const findings=[];let scanned=0,skippedBinary=0;
for(const file of files){const bytes=readFileSync(file);if(bytes.includes(0)){skippedBinary++;continue;}scanned++;if(patterns.some(p=>p.test(bytes.toString('utf8'))))findings.push(file);}
console.log(JSON.stringify({filesScanned:scanned,skippedBinary,credentialPatternFindings:process.argv.includes('--counts-only')?findings.length:findings}));
if(findings.length)process.exitCode=1;
