import { loadEnvConfig } from "@next/env";
import { mkdir, writeFile } from "node:fs/promises";
loadEnvConfig(process.cwd());
async function main() {
  const { observeCompetition } = await import("../src/lib/competition/observe");
  const { createEvidenceReceipt } = await import("../src/lib/competition/receipt");
  const { localSnapshots } = await import("../src/lib/competition/snapshot");
  const observation = await observeCompetition();
  const envelope = createEvidenceReceipt(observation, Date.now());
  const saved = await localSnapshots.save(envelope);
  const started = performance.now();
  let issuerHistory: { status: number | null; latencyMs: number; observedAtMs: number; outcome: string };
  try {
    // Public documented endpoint; no Binance credentials or fabricated issuer key forwarded.
    const response = await fetch("https://api.gm.ondo.finance/v1/assets/NVDAon/shares-multiplier?range=all", { redirect: "error", cache: "no-store", signal: AbortSignal.timeout(12_000), headers: { Accept: "application/json" } });
    await response.body?.cancel();
    issuerHistory = { status: response.status, latencyMs: Math.round(performance.now() - started), observedAtMs: Date.now(), outcome: response.ok ? "Response accessible; applicability still requires schema/history review" : "Access unavailable; no bypass attempted" };
  } catch { issuerHistory = { status: null, latencyMs: Math.round(performance.now() - started), observedAtMs: Date.now(), outcome: "Network unavailable" }; }
  await mkdir(".tools/competition", { recursive: true });
  await writeFile(".tools/competition/live-receipt.json", JSON.stringify(envelope, null, 2), { mode: 0o600 });
  await writeFile(".tools/competition/issuer-history.json", JSON.stringify(issuerHistory, null, 2));
  console.log(JSON.stringify({ classification: envelope.receipt.freshness, asset: envelope.receipt.asset, tokenPrice: observation.quote?.tokenPrice ?? null, providerPriceAtMs: observation.quote?.tokenPriceUpdatedAt ?? null, evaluationAtMs: envelope.receipt.evaluatedAtMs, discovery: observation.discovery, endpoints: observation.audits, issuer: observation.issuer, issuerHistory, scheduledSession: envelope.receipt.session.scheduled.session, decision: envelope.receipt.engine.result.decision, digest: envelope.digest, snapshotSaved: saved }, null, 2));
  if (observation.state !== "connected") process.exitCode = 1;
}
main().catch(() => { console.error("Live capture failed; raw error withheld. Run fixture tests for diagnostics."); process.exitCode = 1; });
