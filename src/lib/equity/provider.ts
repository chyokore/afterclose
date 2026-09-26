import type { TruthInput } from "../reference-truth/models";
/** Provider-neutral interface only. No real-provider transport or credentials. */
export type EquityObservation = {
  ticker: string; company: string | null; currency: string | null; price: string | null;
  provider: { id: string; name: string } | null;
  marketDataAt: { raw: string; unixMs: number; semantics: "exchange-event" | "sip-receipt" | "bar-start" | "provider-update" } | null;
  observedAtMs: number;
  session: "premarket" | "regular" | "postmarket" | "overnight" | "closed" | "halted" | "unknown";
  recency: "real-time" | "delayed" | "eod" | "unknown";
  entitlement: "confirmed" | "unconfirmed" | "denied";
  provenance: { source: string; exchange: string | null; coverage: "consolidated" | "partial" | "unknown" };
  availability: "available" | "unavailable"; reasons: string[];
};
export interface IndependentEquityProvider { observe(ticker: string, observedAtMs: number): Promise<EquityObservation> }
export const unavailableEquityProvider: IndependentEquityProvider = {
  async observe(ticker, observedAtMs) {
    if (!ticker.trim() || !Number.isFinite(observedAtMs) || observedAtMs < 0) throw new Error("Invalid observation request");
    return { ticker, company: null, currency: null, provider: null, price: null, marketDataAt: null, observedAtMs,
      session: "unknown", recency: "unknown", entitlement: "unconfirmed", availability: "unavailable",
      provenance: { source: "AfterClose configuration; no external request made", exchange: null, coverage: "unknown" },
      reasons: ["Independent provider credentials and display entitlements are not established."] };
  },
};
export function unavailableTruth(observedAtMs: number): TruthInput {
  return { mode: "live", available: false, observedAt: { kind: "afterclose-observation", unixMs: observedAtMs },
    token: null, underlying: null, tokenPrice: null, references: [], multiplier: null, session: null, liquidity: null, quote: null, order: null };
}
