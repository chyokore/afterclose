// Launches only local build/test commands with OS essentials; never loads dotenv.
import {spawn} from 'node:child_process';
import {dirname,delimiter} from 'node:path';
const env=Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','PATH','PATHEXT','COMSPEC'].filter(k=>process.env[k]).map(k=>[k,process.env[k]]));
env.PATH=dirname(process.execPath)+delimiter+(env.PATH??'');
env.NEXT_TELEMETRY_DISABLED='1';
const script=process.argv[2];
if(!['build','browser'].includes(script))throw new Error('Use build or browser');
const args=script==='build'?['scripts/build-static-preview.mjs']:['--import','tsx','scripts/check-static-browser.mjs'];
const p=spawn(process.execPath,args,{env,stdio:'inherit',windowsHide:true});
p.on('error',e=>{console.error(e.message);process.exitCode=1;});p.on('exit',code=>{process.exitCode=code??1;});
