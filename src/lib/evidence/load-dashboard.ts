import "server-only";
import { loadRwa } from "../binance/rwa";
import { toReferenceEvidence } from "../binance/reference-adapter";
import { unavailableEquityProvider, unavailableTruth } from "../equity/provider";
import { observeOndoMultiplier } from "../issuer/ondo";
import { observeNasdaqSchedule } from "../session/nasdaq-calendar";
export async function loadDashboard() {
  const [data, issuer] = await Promise.all([loadRwa(), observeOndoMultiplier()]);
  const live = data.state === "connected" ? data : null;
  const evaluatedAtMs = Date.now();
  const independent = await unavailableEquityProvider.observe("NVDA", evaluatedAtMs);
  const evidence = live ? toReferenceEvidence(live) : unavailableTruth(evaluatedAtMs);
  const calendar = observeNasdaqSchedule(evaluatedAtMs);
  // Schedule-only and undated issuer evidence deliberately do not replace engine inputs.
  return { data, live, evaluatedAtMs, independent, evidence, issuer, calendar };
}
