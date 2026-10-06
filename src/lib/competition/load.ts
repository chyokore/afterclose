import "server-only";
import { assertLiveAccess } from "../preview-mode";
import { observeCompetition } from "./observe";
import { createEvidenceReceipt, eligibleSnapshot, snapshotView } from "./receipt";
import { localSnapshots } from "./snapshot";

async function capture() {
  const observation = await observeCompetition();
  const current = createEvidenceReceipt(observation, Date.now());
  const saved = eligibleSnapshot(current) ? await localSnapshots.save(current) : false;
  const last = await localSnapshots.read();
  return { current, saved, last };
}
let inflight: Promise<Awaited<ReturnType<typeof capture>>> | null = null;
let cached: Awaited<ReturnType<typeof capture>> | null = null;
// Per-process request coalescing, no background polling. Original receipt clocks never change.
export async function loadCompetition() {
  assertLiveAccess();
  const now = Date.now();
  if (!cached || now < cached.current.receipt.evaluatedAtMs || now - cached.current.receipt.evaluatedAtMs >= 15_000) {
    inflight ??= capture().finally(() => { inflight = null; });
    cached = await inflight;
  }
  return { ...cached, snapshot: cached.last ? snapshotView(cached.last, Date.now()) : null };
}
