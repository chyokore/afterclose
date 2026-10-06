export type FreshnessState = "LIVE" | "STALE" | "HISTORICAL" | "UNAVAILABLE";
export const freshnessPolicy = Object.freeze({
  version: "afterclose-freshness/v1", observationMaxMs: 30_000,
  token: { maxMs: 60_000, historicalMs: 86_400_000 },
  equity: { maxMs: 60_000, historicalMs: 86_400_000 },
  session: { maxMs: 60_000, historicalMs: 86_400_000 },
  multiplier: { maxMs: 86_400_000, historicalMs: 7 * 86_400_000 },
});
export function classifyFreshness(valuePresent: boolean, providerAtMs: number | null, observedAtMs: number | null, nowMs: number, type: "token" | "equity" | "session" | "multiplier" = "token") {
  const valid = (n: number | null): n is number => n !== null && Number.isSafeInteger(n) && n >= 0 && n <= nowMs;
  const observationAgeMs = valid(observedAtMs) ? nowMs - observedAtMs : null;
  const providerDataAgeMs = valid(providerAtMs) ? nowMs - providerAtMs : null;
  let status: FreshnessState = "UNAVAILABLE";
  let reason = "Value or valid provider/observation clock unavailable; retrieval time cannot replace provider time.";
  if (Number.isSafeInteger(nowMs) && nowMs >= 0 && valuePresent && valid(providerAtMs) && valid(observedAtMs) && providerAtMs <= observedAtMs) {
    const limits = freshnessPolicy[type];
    status = providerDataAgeMs! >= limits.historicalMs ? "HISTORICAL" : providerDataAgeMs! > limits.maxMs || observationAgeMs! > freshnessPolicy.observationMaxMs ? "STALE" : "LIVE";
    reason = status === "HISTORICAL" ? "Provider data is at least one documented historical horizon old." : status === "STALE" ? "Provider or observation age exceeds the research freshness limit." : "Both clocks satisfy the research freshness policy; this does not establish execution readiness.";
  }
  return { status, providerDataAgeMs, observationAgeMs, reason };
}
