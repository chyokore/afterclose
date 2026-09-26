export type FailureCode = "timeout" | "authentication" | "rate-limit" | "configuration" | "network" | "schema" | "provider" | "http" | "setup";
export const failureCopy: Record<FailureCode | "empty", { title: string; action: string }> = {
  timeout: { title: "Binance request timed out", action: "Try Refresh evidence once connectivity recovers. No response is being treated as a quote." },
  authentication: { title: "Binance access was rejected", action: "The operator should verify server credentials, the request clock and API permissions. Do not paste credentials into the page." },
  "rate-limit": { title: "Binance request limit reached", action: "Pause before retrying. The operator should review shared API quotas before increasing traffic." },
  configuration: { title: "Server connection configuration needs attention", action: "The operator should check the documented Binance host and server configuration." },
  network: { title: "Binance connection unavailable", action: "Check connectivity and verified TLS, then refresh. A network failure is not an authentication result." },
  schema: { title: "Provider evidence could not be validated", action: "The operator should reconcile the response schema or asset identity. Unvalidated prices are withheld." },
  provider: { title: "Binance reported an unsuccessful request", action: "The operator should inspect sanitized API diagnostics before retrying. No usable evidence was accepted." },
  http: { title: "Binance returned an HTTP error", action: "Retry later or ask the operator to inspect sanitized diagnostics. No successful response is claimed." },
  setup: { title: "Live connection needs setup", action: "The operator must configure the server credentials privately. The synthetic lab works without them." },
  empty: { title: "NVDAon was not corroborated in this response", action: "The selected BSC asset was absent or inconsistent across discovery sources. This does not establish that it is unsafe or has no liquidity." },
};
export function snapshotMessage(snapshotMs: number, nowMs: number, maxAgeMs: number): string {
  if (![snapshotMs, nowMs, maxAgeMs].every(Number.isFinite) || nowMs < snapshotMs) return "Snapshot age cannot be verified; check the device clock and refresh.";
  return nowMs - snapshotMs > maxAgeMs
    ? "Historical snapshot — refresh to reassess. Displayed decision and evidence ages remain frozen at evaluation time."
    : "Snapshot view, not a streaming feed. A recent retrieval does not establish a fresh underlying quote.";
}
