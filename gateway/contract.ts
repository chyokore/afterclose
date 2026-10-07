import type { EvidenceReceipt } from "../src/lib/competition/receipt";
export type GatewayResponse={
  schemaVersion:"afterclose-live-gateway/v1";
  status:"LIVE_EVIDENCE"|"LIVE_EVIDENCE_UNAVAILABLE";
  reason:string|null;
  cache:{scope:"per-instance";successCooldownMs:30000;failureCooldownMs:60000;metadataDiscoveryTtlMs:300000;platformsChainsTtlMs:3600000};
  // Canonical receipt is the typed evidence contract. No duplicate provider payload.
  receipt:EvidenceReceipt["receipt"];
  receiptDigest:string;
  build:{commit:string;sourceDigest:string;dirty:boolean};
};
