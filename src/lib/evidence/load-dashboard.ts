import "server-only";
import { loadRwa } from "../binance/rwa";
import { toReferenceEvidence } from "../binance/reference-adapter";
import { unavailableEquityProvider, unavailableTruth } from "../equity/provider";
export async function loadDashboard() {
  const data = await loadRwa();
  const live = data.state === "connected" ? data : null;
  const evaluatedAtMs = live ? Date.parse(live.fetchedAt) : Date.now();
  const independent = await unavailableEquityProvider.observe("NVDA", evaluatedAtMs);
  const evidence = live ? toReferenceEvidence(live) : unavailableTruth(evaluatedAtMs);
  return { data, live, evaluatedAtMs, independent, evidence };
}
