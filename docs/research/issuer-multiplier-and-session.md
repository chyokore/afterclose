# Issuer multiplier and US equity session evidence

Reviewed September 26, 2026, starting at `074f6266e47f25c7cd3debf2eaba23af5a0ba033`. AfterClose only; no accounts, credentials, wallet operations or transactions were created.

## Outcome

The official Ondo public asset page corroborates NVDAon / NVDA, NVIDIA Corporation Common Stock, BSC chain 56, contract `0xa9ee28c80f960b889dfbd1902055218cba016f75` and 18 decimals. It reports `sharesMultiplier` as the exact string `1.0017152487959898`. This was newly observed on the issuer page, not filled from Binance history. **Effective time and forward validity remain unavailable, so this is issuer-reported, not a currently verified multiplier.**

A read-only page adapter exposes this incomplete evidence. A separate bounded Nasdaq schedule adapter supports calendar context. Neither changes the engine's multiplier or authoritative session inputs; live WAIT is preserved.

## Official Ondo sources and actual access

The [current API overview](https://docs.ondo.finance/api-reference/overview) directs integrators to issuer onboarding for API access. No contact was made. The older ReadMe docs identify themselves as deprecated; current documentation and the [official OpenAPI schema](https://docs.ondo.finance/openapi.json) were used.

| Read-only request | Actual result | Local observation |
| --- | --- | --- |
| GET `https://docs.ondo.finance/openapi.json` | HTTP 200 | Official API base and GET paths inspected |
| GET `https://api.gm.ondo.finance/v1/assets/NVDAon/addresses` | HTTP 403, 1,535 ms, `{"message":"Forbidden"}` | 2026-09-26T17:53:18.543Z |
| GET `https://api.gm.ondo.finance/v1/assets/NVDAon/shares-multiplier?range=all` | HTTP 403, 749 ms, `{"message":"Forbidden"}` | 2026-09-26T17:53:19.295Z |
| GET [official NVDAon page](https://app.ondo.finance/assets/nvdaon) | HTTP 200; matching asset metadata present | New adapter subsequently returned reported evidence at Unix ms 1790445689387 |

The two API probes sent **no credentials**. Their generic 403 does not establish whether the cause is API entitlement, gateway policy or another access restriction. Do not relabel it as the documented `MISSING_API_KEY` 401 or `ASSET_NOT_FOUND` 404. Binance credentials were not reused. TLS remained enabled with process-local Node system CA trust.

The address endpoint schema documents chain-specific addresses, but its schema and example differ on array/object structure. No successful address API payload was obtained. Contract corroboration instead comes from the official page's adjacent `symbol`, `ticker`, `underlyingName` and `supportedNetworks` fields. Symbol alone was not accepted as a contract match.

### History, units and economic applicability

[Multiplier history](https://docs.ondo.finance/api-reference/assets/get-shares-multiplier-history-for-an-asset) requires symbol and range (`1day`, `1month`, `3month`, `6month`, `1year`, `all`). Documented fields are `history[].sharesMultiplier` (decimal string), `changeTimestamp` and response `timestamp`. The history describes the earliest timestamp of each changed value; unchanged events may be omitted. The page response used here supplied neither a change timestamp nor an effective block. No history or current applicability was inferred.

[Caching documentation](https://docs.ondo.finance/api-reference/endpoint-caching) lists one-second multiplier-history caching. A cache duration is not a future validity promise and does not establish an effective timestamp. It also does not prove the public website's cache behavior.

[Ondo pricing documentation](https://docs.ondo.finance/ondo-stocks/token-and-quote-pricing) explicitly describes shares represented per token and total-return exposure. The direction is **shares/token**, not its inverse. For an unscaled token price T and compatible unadjusted equity price E, with verified ratio m: comparable per-share token price is T/m; equity-equivalent per-token value is E*m. No numerical normalization was performed this milestone.

That source also describes display scaling on BNB Chain and Solana: displayed units and displayed unit prices can change while underlying onchain balances do not. Binance's price basis must be reconciled with the issuer's multiplier basis before applying it; avoid double scaling.

[Corporate-action guidance](https://docs.ondo.finance/ondo-stocks/corporate-actions) describes dividend reinvestment, possible pauses around ex-dates and delayed incorporation of off-hours news. Other actions can require additional treatment. We did not obtain a dated NVDAon corporate-action history or assume a perpetual ratio. A date alone would still require effective-time semantics and applicability at both comparison prices.

## Implemented issuer boundary

`src/lib/issuer/ondo.ts` fetches only the official public page, server-side, without authentication or wallet context. It rejects redirects, non-HTML, oversized responses and failures; the request has an eight-second timeout and no cache. The page is a fragile presentation interface, **not a stable API contract**.

`multiplier.ts` parses only the observed structured metadata, validates symbol/ticker plus the exact BSC address and decimals, and rejects missing, duplicate or malformed records. It retains the ratio as a decimal string; positivity uses exact BigInt arithmetic. There is no floating-point financial conversion. Observation time means local receipt only. Effective time and validity remain null, units are shares-per-token, source is issuer, verification is unverified. Failures never load a historical substitute.

The normalized schema and admission guard reject invalid units, unverified/history-only evidence, mixed provenance and inapplicable corporate-action intervals. This guard does not manufacture an engine value: the existing engine's numeric multiplier is deliberately left null. Future exact-ratio engine integration needs a separate reviewed arithmetic migration once applicability and price basis are established.

## Nasdaq schedule research

The [Nasdaq Trader 2026 calendar](https://www.nasdaqtrader.com/Trader.aspx?id=Calendar) was publicly readable without an account. Its full-year holiday dates and November 27 / December 24 13:00 ET regular-session closes were transcribed. It directs readers to additional notices for early-close system hours. The adapter does not guess early-close after-hours availability.

[Nasdaq's hours page](https://www.nasdaq.com/market-activity/stock-market-holiday-schedule) describes weekday regular trading 09:30–16:00 ET, premarket 04:00–09:30 and after-hours 16:00–20:00. The [system-hours PDF](https://www.nasdaqtrader.com/content/TechnicalSupport/nasdaq_sys_hours.pdf) corroborates the standard system/market windows. This is the Nasdaq Stock Market schedule, not every US venue or a broker's availability. America/New_York via Intl handles daylight-saving offsets; no fixed UTC offset is used.

[Nasdaq's August 17 notice](https://www.nasdaqtrader.com/TraderNews.aspx?id=ETA2026-46) announces a new 21:00–04:00 session for December 6, 2026 and trade-date implications. This implementation explicitly stops before December 6 rather than prematurely implementing that regime. The stored calendar includes full-year holiday facts, but the classifier does not claim full-year hours coverage.

Public documentation access is confirmed; it is not an equity quote subscription or entitlement. No live data feed, redistribution contract or commercial quote-display rights were obtained. The component attributes a manually reviewed schedule and does not redistribute exchange price data. Quote coverage, broker access and live security halts remain separate requirements.

## Session adapter and UI

`src/lib/session/nasdaq-calendar.ts` returns market XNAS, calendar date, America/New_York, source links, source-observation time, evaluation time, coverage dates, mode, availability and scheduled session. The source review time is fixed at the actual research observation, not refreshed when the page reloads. A **local seven-day review limit** makes old snapshots unavailable; it is not a provider guarantee or an engine-policy change.

Calendar absent/invalid, future/stale observation, mixed synthetic/live mode, out-of-coverage date and unconfirmed early-close extended hours return unknown. Weekends and published holidays classify scheduled closed within the valid reviewed window. At this milestone's live check, September 26 classified scheduled closed. All results remain `scope: published-schedule`, with authoritative live status unverified. No calendar result proves a fresh equity quote or absence of a halt/emergency closure.

The dashboard displays the issuer string with explicit missing effective/expiry times, exact blocking reasons, source observation time, and separately labeled scheduled session. Independent equity and execution evidence remain unavailable. Engine evaluation uses actual assembly time while preserving Binance's original observation clocks; waiting for the issuer page cannot silently refresh Binance data. Production thresholds, engine rules and the 12-scenario lab remain unchanged.

## Regression and operational requirements

Regression coverage includes missing and historical multiplier, invalid/inverse units, exact decimal preservation, corporate-action boundaries, malformed page metadata, weekend, holidays, early close, both DST offsets, unavailable/stale calendars, coverage cutoff and synthetic/live separation. The sanitized captured issuer metadata is stored only in test fixtures; hypothetical calendar review times and corporate-action ratios are test-only.

Remaining requirements: authenticated issuer history or equivalently authoritative dated evidence; validity policy and BSC scaling reconciliation; stable issuer access; renewed calendar review and the December hours change; authoritative exchange/security status; two qualified independent equity references; liquidity and executable quote evidence. No wallet execution is implemented.
