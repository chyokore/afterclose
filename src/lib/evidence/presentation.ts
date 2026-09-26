/** Timezone formatting does not infer a market session or fill missing timestamps. */
export function timestampLabel(unixMs: number | null | undefined, zone: "UTC" | "America/New_York" = "UTC"): string {
  if (unixMs == null || !Number.isFinite(unixMs) || unixMs < 0 || Number.isNaN(new Date(unixMs).getTime())) return "Unavailable";
  return new Intl.DateTimeFormat("en-US", { timeZone: zone, year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZoneName: "short" }).format(unixMs);
}
export function ageLabel(unixMs: number | null | undefined, evaluatedAtMs: number): string {
  if (unixMs == null || !Number.isFinite(unixMs) || unixMs < 0) return "Unavailable";
  if (unixMs > evaluatedAtMs) return "Future timestamp — invalid evidence";
  const seconds = Math.floor((evaluatedAtMs - unixMs) / 1000);
  return seconds < 60 ? `${seconds}s` : seconds < 3600 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m`;
}
export const evidenceProvenance = [
  { field: "Token identity / decimals", source: "Binance RWA tokens → chain 56; search corroborates identity", status: "Provider-reported" },
  { field: "Token price / update time", source: "Binance RWA price → tokenPrice / tokenPriceUpdatedAt", status: "Token market evidence only" },
  { field: "Per-share reference", source: "Binance RWA price and underlying-market → referencePrice", status: "Token-derived; not independent" },
  { field: "Shares per token", source: "Binance RWA tokens → tokenToShareRatio", status: "Reported value; current issuer validity unverified" },
  { field: "Underlying session", source: "Reviewed Nasdaq schedule shown separately from Binance raw status", status: "Schedule-only; actual exchange and security status unverified" },
  { field: "Issuer multiplier", source: "Official Ondo public asset page, when accessible", status: "Exact decimal retained; effective time and current validity unavailable" },
  { field: "Independent equity quote", source: "No independent provider connected", status: "Unavailable; no price or event timestamp" },
  { field: "Contract corroboration", source: "Indexed BscScan metadata examined September 26, 2026", status: "Historical explorer corroboration; separate current issuer check shown above" },
  { field: "AfterClose snapshot time", source: "Application time when the response bundle was assembled", status: "Observation time, not a market-price timestamp" },
] as const;
