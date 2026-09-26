# Independent US equity reference providers

Research date: 2026-09-26. Repository baseline: `ecbea8323ffeee1736aef8665b778b392c971ebd`.

## Decision

Select **Massive (formerly Polygon.io), business contract with an entitled full-market trade/quote feed**, as the primary technical choice. Select **Twelve Data business access** as a conditional fallback for research display, subject to confirming event-timestamp semantics, session coverage and redistribution rights. Neither selection authorizes a purchase, account creation or implementation. No new credentials were obtained, no account-specific NVDA quotes were tested, and no provider adapter was added.

Massive best matches the need to distinguish the exchange event, consolidated-feed receipt and application observation. Its business baseline's calculated Fair Market Value must not be silently substituted for an actual stock trade/quote. Twelve Data offers a simpler fallback but its default venue coverage and shorter real-time premarket window make it a materially different reference. If its timestamp ambiguity cannot be resolved, do not admit it as freshness-qualified engine evidence. Alpaca SIP is the next technical candidate if Twelve Data fails those gates and suitable commercial rights can be obtained.

AfterClose currently requires two independent providers, references no older than 60 seconds, observations no older than 30 seconds, and regular-session review. A fallback used only when the primary is down does **not** satisfy the two-provider requirement. No policy thresholds are changed by this document.

## Comparison

“Documented” means a provider's official material supports the feature, not that AfterClose has tested an entitled account. All candidates offer underlying US equity data rather than Binance token-derived prices. NVDA eligibility follows their documented US-listed-stock coverage; exact NVDA metadata and account entitlements must still be verified. No successful NVDA API response from these providers is claimed here.

| Provider | Independent NVDA reference and coverage | Timestamp / source information | Sessions and status | Access and restrictions |
| --- | --- | --- | --- | --- |
| Massive / Polygon | US stock trades and quotes; full-market or venue-limited feeds must be distinguished from calculated FMV | REST participant and SIP nanosecond timestamps; exchange ID, conditions and tape; ticker reference includes listing exchange and currency | Regular, premarket 04:00–09:30 and after-hours 16:00–20:00 ET; market status exposes earlyHours/afterHours and exchange status | Free Basic EOD; paid delayed and real-time tiers; public product requires business rights and relevant feed entitlements |
| Finnhub | Official SDK advertises real-time stocks and company profiles; US quote endpoint exists. NVDA account coverage not tested | Exact quote timestamp semantics and execution venue coverage remain unconfirmed in accessible official docs | Market-status and holiday SDK methods confirmed. Exact pre/post quote coverage and plan access unresolved | Commercial offering exists; current free quota and free quote entitlement could not be verified from official pricing in this session |
| Twelve Data | Listed US equities including Nasdaq; default real-time feed represents about 5% of total trading, not consolidated coverage | quote.timestamp is interval opening time; last_update_at exists but event semantics need confirmation; symbol/name/exchange/currency metadata | Regular; real-time extended window 07:00–20:00 ET on Pro or higher; historical 04:00–20:00 for records older than one day; exchange_schedule and extended-hours flag | Basic has limited credits; business/public use requires business licensing and redistribution agreement as applicable |
| Alpha Vantage | US stock quotes/time series; NVDA symbol lookup and entitled quote still need testing | Intraday bar times; premium bulk sample has timestamp and extended_hours_quote, but event association/timezone need confirmation; Global Quote date is insufficient | Regular and premium bulk extended hours; MARKET_STATUS provides venue open/closed rather than a complete security-session/halts model | Free standard allowance 25 requests/day; real-time/15-minute delayed US data premium; commercial arrangement through sales |
| Alpaca (alternative) | US equities; Basic real-time IEX only, paid complete exchange coverage | Trade/quote t is RFC3339 with nanosecond precision; execution/bid/ask exchange codes and tape | Pre/post bars documented; security status stream includes halts; separate calendar/session context needed | Free Basic and paid Algo Trader Plus are individual access; business distribution needs explicit approval, not assumed from paying for Plus |

## Official evidence and limits by provider

### Massive

[Stocks product and pricing](https://www.massive.com/stocks) confirms US ticker coverage, Polygon continuity, personal versus business use and feed choices. At review: Basic is EOD/5 calls per minute; Starter is $29/month with 15-minute delayed data; Advanced is $199/month real-time personal use. Paid plans advertise unlimited API calls. Business is listed at $2,499/month with FMV intraday/SIP EOD; Full Market real-time add-on is $1,999/month, before applicable exchange fees. These are research snapshots, not an approved budget or binding quote. Business rights and the precise display/non-display use still need contractual confirmation.

[REST trades](https://massive.com/docs/rest/stocks/trades-quotes/trades) separates `participant_timestamp` (exchange event) from `sip_timestamp` (SIP receipt); preserve both, along with exchange/conditions/corrections. [Trade data explanation](https://www.massive.com/blog/insights-from-trade-level-data) explains exchange IDs and TRF receipt. Do not parse nanosecond integers through an imprecise JavaScript Number before converting to milliseconds; retain the raw integer string and use a lossless parser/BigInt conversion.

[Extended-hours coverage](https://massive.com/knowledge-base/article/market-data-outside-of-normal-hours) confirms 04:00–20:00 ET. Missing aggregate bars can reflect trade eligibility, not absent activity. [Market status](https://massive.com/docs/rest/stocks/market-operations/market-status) provides exchange state and pre/post flags; its serverTime is not a quote timestamp. Prefer specific endpoint timestamp definitions: the broad WebSocket overview's seconds wording differs from the [timestamp FAQ](https://massive.com/knowledge-base/categories/trades), which describes REST nanoseconds and WebSocket milliseconds. Resolve against the selected channel schema before mapping.

### Finnhub

[Official quote documentation](https://finnhub.io/docs/api/quote), [market status](https://finnhub.io/docs/api/market-status), and [pricing](https://finnhub.io/pricing) returned no readable body in the web reader; an in-app browser navigation to quote docs timed out. This is a documentation-access failure, **not** an API authentication or data failure.

The [official Python SDK](https://github.com/Finnhub-Stock-API/finnhub-python) confirms quote, company-profile, market-status and holiday operations. Its advertised stock coverage makes NVDA a reasonable discovery target, not a tested entitlement. The [official Go quote model](https://raw.githubusercontent.com/Finnhub-Stock-API/finnhub-go/master/model_quote.go) does not establish a usable price-event timestamp for this design. Do not import third-party claims about `t`, free 60/min quotas or extended-hours access as confirmed facts.

An indexed [official commercial pricing result](https://api.finnhub.io/pricing-startups-and-enterprise) advertised commercial use/redistribution and sales contact, but direct rendering was empty. Require current written scope, quota, feed/exchange provenance, timestamp units/meaning, regular/pre/post availability and public-display rights. No free-plan feature or numerical quota is endorsed here. Finnhub is not selected while those requirements remain unresolved.

### Twelve Data

[US equities coverage](https://support.twelvedata.com/en/articles/9935903-us-equities-market-data) confirms Nasdaq/NYSE listings, default partial-market real-time coverage, and separately arranged consolidated coverage. Historical/EOD coverage is broader and available from Basic, but cannot serve as a fresh intraday reference. Listing exchange is metadata, not proof of the execution venue or consolidated coverage.

[Extended hours](https://support.twelvedata.com/en/articles/5195429-pre-post-market-data) documents `prepost=true`, the real-time 07:00–20:00 ET window and Pro-or-higher requirement. This leaves 04:00–07:00 uncovered by that real-time offering. [February release notes](https://twelvedata.com/news/feb-2025-updates) define quote.timestamp as interval opening time. [April notes](https://twelvedata.com/news/apr-2025-updates) add UTC last_update_at and datetime-based exchange_schedule. Neither statement alone proves last_update_at is the last eligible trade time. Require written semantics or a clearly documented event-timestamped channel before engine admission.

[Individual pricing](https://twelvedata.com/pricing) lists Basic at 8 API credits (800/day), Grow 55+, Pro 610+, Ultra 2,584+ credits per minute. The [credit policy](https://support.twelvedata.com/en/articles/5615854-credits) confirms minute resets and Basic daily resets at midnight UTC; endpoint weights must be checked for the chosen workload. Do not interpret credits as unrestricted requests. [Commercial-use policy](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage) restricts individual plans to personal/internal/non-production use; business plans permit commercial display subject to exchange conditions, with redistribution separately agreed. The US equities article uses broader paid-plan wording. Treat this as a documentation inconsistency and obtain written public-dashboard rights; do not choose the permissive reading by assumption. No public launch on Basic/Pro is approved.

### Alpha Vantage

[API documentation](https://www.alphavantage.co/documentation/) covers symbol search, regular-session data, premium real-time bulk quotes with pre/post values, and MARKET_STATUS. Global Quote defaults to EOD unless entitled; its latest trading day does not provide event-level freshness. Intraday bar timestamps describe bars, not individual trades. Company overview can supply exchange/currency metadata, not execution-venue provenance.

The linked [official bulk documentation example](https://www.alphavantage.co/query?function=REALTIME_BULK_QUOTES&symbol=MSFT,AAPL,IBM&apikey=demo) explicitly returned **artificial illustrative data**. We inspected only its field structure: `timestamp`, `close`, `extended_hours_quote`. No sample price is reproduced as market evidence. Confirm timezone, which price that timestamp dates, trade eligibility and separate extended-price freshness before integration.

[Support](https://www.alphavantage.co/support/) states 25 requests/day for ordinary free use; verified educational/open-source exceptions are not assumed for AfterClose. Real-time and 15-minute delayed US access is premium-only. Paid rate depends on selected subscription; a commercial quote is needed. [Terms](https://www.alphavantage.co/terms_of_service/) and API documentation direct commercial use to sales; premium personal membership does not establish public redistribution rights.

### Alpaca alternative

[Market Data plans](https://docs.alpaca.markets/us/docs/about-market-data-api) list Basic free IEX real-time with 200 historical calls/minute and a latest-15-minute historical restriction; Algo Trader Plus is $99/month with all-US-exchange real-time and 10,000 historical calls/minute. Those quotas are specifically historical API limits. Feed entitlement, websocket symbol/connection limits and business access remain separate. No account was created.

[Real-time schema](https://docs.alpaca.markets/us/docs/real-time-stock-pricing-data) provides event timestamp `t`, exchange codes and trade conditions; it documents extended-session bars and security trading-status messages. These are stronger timestamp primitives than a date-only daily quote. A calendar plus explicit session mapping is still needed; a halt message is not a premarket clock. Actual coverage follows the feed/venue, so Basic IEX must not be labeled full-market SIP. The official support redistribution page was inaccessible; public redistribution permission is unresolved, not inferred from the individual subscription. This and the brokerage-oriented business setup make it a secondary alternative for AfterClose.

## Provider-neutral provenance model (design only)

The following is a proposed boundary record, not an implemented schema or adapter. Null means unavailable, never zero or a fabricated timestamp.

```ts
type EquityObservation = {
  underlying: { ticker: string; company: string | null;
    listingMic: string | null; currency: string | null };
  provider: { id: string; name: string };
  price: { decimal: string; kind: "last-trade" | "bid" | "ask" |
    "midpoint" | "bar-close" | "calculated-value";
    adjustment: "unadjusted" | "split-adjusted" | "total-return" | "unknown" } | null;
  marketDataAt: { raw: string; unit: "s" | "ms" | "ns" | "rfc3339";
    unixMs: number | null; semantics: "exchange-event" | "sip-receipt" |
    "bar-start" | "bar-end" | "provider-update" | "unknown" } | null;
  observedAtMs: number; // AfterClose's local receipt time only
  marketSession: { value: "premarket" | "regular" | "postmarket" |
    "overnight" | "closed" | "halted" | "unknown";
    scope: "security" | "exchange"; source: string;
    providerStatusAtMs: number | null; observedAtMs: number };
  recency: { classification: "real-time" | "delayed" | "eod" | "unknown";
    contractualDelayMs: number | null };
  entitlement: { plan: string | null; feed: string | null;
    access: "confirmed" | "unconfirmed" | "denied";
    publicDisplay: "allowed" | "denied" | "unconfirmed";
    agreementRef: string | null; checkedAtMs: number | null };
  provenance: { endpointId: string; documentationUrl: string;
    feedCoverage: "consolidated" | "single-venue" | "partial" | "unknown";
    eventExchange: string | null; upstreamSourceIds: string[];
    rawRecordHash: string | null; requestId: string | null };
  availability: { status: "available" | "partial" | "unavailable";
    reasons: string[] }; // controlled codes, no provider raw errors/secrets
};
```

Validate nonempty identities, positive finite decimal price, ISO currency, explicit timestamp units and timestamp-price association. Keep exact raw event precision; convert losslessly to engine milliseconds. A received response can contain an old or missing market event. Record delay as entitlement metadata; never subtract contractual delay from event age to make it fresh. A status endpoint's clock is not the price clock. Resolve US sessions with America/New_York and holiday/early-close rules, not a fixed UTC offset. Unknown or conflicting session evidence remains unknown.

Keep a sanitized provider record separately from normalized engine evidence, subject to retention rights. Do not store key-bearing URLs, auth headers or full commercial agreements in public Git. Preserve price kind, source coverage and adjustment basis when comparing providers; do not compare an adjusted daily close against an unadjusted spot price unnoticed. Two vendors may share the same upstream SIP; provider diversity is not automatically independent source diversity.

## NVDAon multiplier

The previous Binance capture reported `1.0017152487959898` for contract `0xa9ee28c80f960b889dfbd1902055218cba016f75`, chain 56. That is a historical provider report, not a current verified ratio.

[Ondo's product explanation](https://ondo.finance/ondo-stocks) describes total-return exposure with reinvested dividends net of applicable withholding. [Chainlink's Ondo integration documentation](https://docs.chain.link/data-feeds/tokenized-equity-feeds/ondo) explicitly defines token value as equity market price multiplied by Ondo's synthetic-shares multiplier. Dividend reinvestment and corporate actions can change the multiplier in either direction. This verifies the general economic direction, not that Binance's captured ratio equals the current BSC oracle value.

With verified shares-per-token multiplier m, token price T (USD/token), and independent unadjusted equity reference E (USD/share):

- Comparable token price per share = T / m.
- Equity-equivalent value per token = E * m.
- Normalized gap in basis points = ((T / m) / E - 1) * 10,000.

These are equivalent unit conversions, not a guarantee of executability or profit. Do not apply dividend adjustment twice by combining a total-return-adjusted equity series with the issuer's reinvestment multiplier.

[Current Ondo multiplier-history documentation](https://docs.ondo.finance/api-reference/assets/get-shares-multiplier-history-for-an-asset) exposes `history[].sharesMultiplier` and `changeTimestamp`, with a separate response `timestamp`. It reports the earliest timestamp of each value change; unchanged events may not appear. The endpoint requires issuer API access. No request with real credentials was made. The older ReadMe site is marked deprecated; the current Ondo page was used instead.

Before admitting m: confirm NVDAon symbol/chain/contract against issuer metadata; obtain issuer multiplier history and caching guarantees; reconcile it with Binance's field and corporate-action basis; establish applicability at both price timestamps. A change timestamp is not a promised future expiry. The current engine requires effectiveAtMs and validUntilMs; do not invent either from retrieval time or set infinity. If issuer evidence cannot support that validity interval under an explicitly documented policy, leave multiplier null and WAIT. No new oracle or issuer key was added.

## Integration plan and acceptance gates

1. User approves the selected provider/account and spending, if any. Obtain written feed coverage, public display, non-display analysis, storage/redistribution, attribution and derived-output rights for AfterClose. Verify the actual plan entitlement; no sales messages have been sent.
2. Only once authorized credentials exist, implement a server-only Massive adapter with pinned official host, TLS enabled, timeouts, bounded backoff and sanitized diagnostics. Preserve the Binance client. Start with read-only NVDA reference metadata, entitled eligible trades/quotes and session status. Reject identity/currency mismatches.
3. Validate real responses against explicit runtime schemas. Record participant/event time, SIP receipt where supplied, local receipt, units, price type and feed. Missing event semantics cannot become a fresh independent reference. Reject canceled/ineligible prints and stale caches; do not mistake bar start for latest trade.
4. Add the neutral record alongside the existing engine model. An admission layer maps only qualified equity evidence to references with basis independent-equity, real provider identity, priceAt and observedAt. Unknown entitlement, timestamp or inappropriate adjustment basis remains unavailable with a reason; retain research display only where licensed. Never refresh timestamps on cached data.
5. Add Twelve Data only after its timestamp/licensing gates pass. Keep each reference and upstream provenance separate. Retain two-provider minimum and disagreement checks; an outage or sole provider leaves WAIT. Do not count two endpoints of Massive as two providers.
6. Obtain separately verified ratio applicability; map underlying company/exchange/currency from verified metadata, not ticker guessing. Existing missing multiplier, liquidity, order and executable-quote checks remain blocking. Default regular-only review remains unchanged even if pre/post prices can be displayed.
7. After implementation is authorized, test regular/pre/post/closed/holiday/halts; seconds/ms/ns precision; missing/future/stale timestamps; delayed/EOD entitlements; split/dividend basis; provider disagreement; auth/429/timeouts; fallback and duplicate upstreams. Live tests must record actual entitlement and sanitized evidence. Keep documentation examples and synthetic fixtures outside production adapters.

No runtime changes in this milestone. No new key, wallet, order, transaction or broadcast integration. Binance's five-endpoint success remains evidence from the previous milestone; it was not retested for this research task.
