// Local loading-state QA only. No provider request or fabricated price.
globalThis.fetch=async function(){
  await new Promise(r=>setTimeout(r,2500));
  throw new Error('Local QA transport unavailable');
};
