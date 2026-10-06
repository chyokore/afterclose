import "server-only";
import { assertLiveAccess } from "../preview-mode";
import { observeCompetition } from "./observe";
import { createEvidenceReceipt, eligibleSnapshot, snapshotView } from "./receipt";
import { localSnapshots } from "./snapshot";
import { deploymentConfiguration } from "../deployment";
import { unavailableObservation } from "./unavailable";
import { evidenceCache } from "./cache";

async function capture() {
  const observation = await observeCompetition().catch(() => unavailableObservation("provider"));
  const current = createEvidenceReceipt(observation, Date.now());
  const saved = eligibleSnapshot(current) ? await localSnapshots.save(current) : false;
  const last = await localSnapshots.read();
  return { current, saved, last };
}
const sharedCapture=evidenceCache(capture,v=>v.current.receipt.observation.state!=="connected");
// Re-evaluate cached raw evidence without resetting any provider or observation clock.
export async function loadCompetition(validRequest = true) {
  if(!validRequest || !deploymentConfiguration().liveAllowed){
    const current=createEvidenceReceipt(unavailableObservation(),Date.now());
    return {current,saved:false,last:null,snapshot:null};
  }
  assertLiveAccess();
  const cached=await sharedCapture(), now=Date.now();
  const current=createEvidenceReceipt(cached.current.receipt.observation,now);
  return { ...cached,current,snapshot:cached.last?snapshotView(cached.last,now):null };
}
