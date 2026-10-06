// Local integration audit only: count destinations, never headers, URLs or bodies.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs=require('node:fs');
const original=globalThis.fetch;
globalThis.fetch=async function(input,init){
  const u=new URL(String(input));
  const name=u.hostname==='web3.binance.com'?'binance':u.hostname==='app.ondo.finance'?'ondo':'unexpected';
  fs.appendFileSync(process.env.AFTERCLOSE_NETWORK_AUDIT,name+'\n');
  if(name==='unexpected')throw new Error('Unexpected integration destination');
  return original(input,init);
};
