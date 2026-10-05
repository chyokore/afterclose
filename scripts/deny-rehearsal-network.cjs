/* eslint-disable @typescript-eslint/no-require-imports -- Node preload for isolated rehearsal. */
// Rehearsal-only instrumentation. Not imported by the application.
const fs = require('node:fs');
globalThis.fetch = async () => {
  fs.appendFileSync(process.env.AFTERCLOSE_NETWORK_AUDIT, 'blocked fetch\n');
  throw new Error('Outbound fetch forbidden during synthetic rehearsal');
};
