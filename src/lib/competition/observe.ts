import "server-only";
import { platforms, tokens, search, prices, underlyingMarket } from "../binance/rwa";
import { ApiError, credentialsConfigured, rwaGet, type ResponseAudit } from "../binance/client";
import { assertLiveAccess } from "../preview-mode";
import { observeOndoMultiplier } from "../issuer/ondo";
import { chainSchema, discoverNvda, endpointOrder, liveObservationSchema, type LiveObservation } from "./model";

export const competitionOperations = { platforms, tokens, search, prices, underlyingMarket,
  chains: (record?: (audit:ResponseAudit)=>void) => rwaGet("chain-list", {binanceChainId:"56"}, chainSchema, record),
  issuer: observeOndoMultiplier };
export async function observeCompetition(operations = competitionOperations): Promise<LiveObservation> {
  assertLiveAccess();
  const {platforms,tokens,search,prices,underlyingMarket,chains,issuer:readIssuer}=operations;
  const audits: ResponseAudit[] = [];
  const record = (a: ResponseAudit) => { audits.push(a); };
  const issuerPromise = credentialsConfigured() ? readIssuer() : Promise.resolve(null);
  const observation: Omit<LiveObservation, "issuer"> = { mode: "live", state: "unavailable", failure: null, token: null, quote: null, market: null, discovery: "UNVERIFIED", searchCompany: null, audits: [], chains: null };
  if (!credentialsConfigured()) observation.failure = "setup";
  else {
    try {
      // Settle every independent request before returning, including partial failure audits.
      const initial = await Promise.allSettled([platforms(record), tokens(record), search("NVDA", record), chains(record)]);
      const [p, t, s, c] = initial;
      if (c.status === "fulfilled") observation.chains = c.value;
      for (const response of initial) if (response.status === "rejected") throw response.reason;
      if (p.status !== "fulfilled" || t.status !== "fulfilled" || s.status !== "fulfilled") throw new ApiError("schema");
      Object.assign(observation, discoverNvda(t.value, p.value, s.value));
      if (!observation.token || observation.discovery === "UNVERIFIED" || !observation.chains?.some(c => c.binanceChainId === "56")) observation.failure = "discovery";
      else {
        const token = observation.token;
        const responses = await Promise.allSettled([prices(token.tokenContractAddress, record), underlyingMarket(token.tokenContractAddress, record)]);
        for (const response of responses) if (response.status === "rejected") throw response.reason;
        const [q, m] = responses;
        if (q.status !== "fulfilled" || m.status !== "fulfilled") throw new ApiError("schema");
        const same = (v: { binanceChainId: string; platformId: string; tokenContractAddress: string }) => v.binanceChainId === token.binanceChainId && v.platformId === token.platformId && v.tokenContractAddress.toLowerCase() === token.tokenContractAddress.toLowerCase();
        const quotes = q.value.filter(same);
        if (quotes.length !== 1 || !same(m.value)) throw new ApiError("schema");
        observation.quote = quotes[0]; observation.market = m.value;
        observation.state = "connected";
      }
    } catch (error) { observation.failure = error instanceof ApiError ? error.kind : "schema"; }
  }
  const issuer = await issuerPromise;
  return liveObservationSchema.parse({ ...observation, audits: audits.sort((a,b) => endpointOrder.indexOf(a.endpoint) - endpointOrder.indexOf(b.endpoint)), issuer: {
    availability: issuer?.availability ?? "unavailable", value: issuer?.evidence?.value ?? null,
    observedAtMs: issuer?.observedAtMs ?? null, source: "https://app.ondo.finance/assets/nvdaon",
    effectiveAtMs: null, validUntilMs: null, verification: "unverified",
  } });
}
