import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const files = execFileSync('git', ['ls-files','--cached','--others','--exclude-standard','-z'], { encoding:'utf8' }).split('\0').filter(Boolean);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}/,
  /(?:BINANCE_API_KEY|BINANCE_SECRET_KEY)[ \t]*=[ \t]*["']?[A-Za-z0-9+\/_=-]{20,}/,
];
const findings = [];
let scanned = 0;
for (const file of files) {
  if (/\.(png|jpe?g|gif|zip|pdf)$/i.test(file)) continue;
  scanned++;
  if (patterns.some(pattern => pattern.test(readFileSync(file,'utf8')))) findings.push(file);
}
console.log(JSON.stringify({ filesScanned:scanned, credentialPatternFindings:findings }));
if (findings.length) process.exitCode = 1;
