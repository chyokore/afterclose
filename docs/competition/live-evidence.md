> Historical local-application milestone. For the deployed static frontend and current verification path, use the [judge proof index](../submission/proof-index.md).

# Competition live evidence

Reviewed 2026-10-06. This milestone runs locally at `/live`. It is not deployed. The existing [synthetic preview](https://afterclose-preview.pages.dev/) remains unchanged.

## Baseline and implementation

Branch: `codex/competition-live-evidence`. Base: `codex/static-synthetic-preview`, exact commit `4801dd9729df5651d01fce157380b56d38dff02b`. Despite its name, this branch retains the complete Next.js application, authenticated adapters, engine, issuer/calendar work, execution research and 12 scenarios. The standalone static target was additive, not a stripped application. No later baseline improvements required cherry-picking. The protected branch still points at that commit; `main` was not merged or changed.

Pipeline: fixed-host server-only signed GET → discovery by issuer/symbol/company/chain → compare historical contract → six request audits → separate price and observation clocks → unchanged Reference Truth Engine → canonical receipt → local snapshot. See `src/lib/competition/`, `src/app/live/page.tsx` and `tests/competition.test.ts`.

Only allowlisted, schema-parsed response fields survive. Authentication headers, signatures, nonces and arbitrary error bodies are excluded. All six successes, a unique rediscovered identity, matching endpoint identities and chain 56 are required for transport verification. CHANGED/UNVERIFIED identities cannot enter engine token evidence or snapshot storage. A successful HTTP call alone is insufficient.

## Genuine capture — historical record, not a current quote

The committed [captured receipt](captured-evidence.json) is a frozen record from this run. Never serve it as a replacement for current data. Its original token classification was LIVE; any subsequent inspection of the saved capture is HISTORICAL.

- NVDAon / NVIDIA (Ondo), NVDA / Nvidia Corp, Ondo, BSC 56, decimals `18`.
- Rediscovered contract: `0xa9ee28c80f960b889dfbd1902055218cba016f75`; historical comparison **MATCH**.
- Exact token price: `241.622303710990170189` USD/token.
- Provider `tokenPriceUpdatedAt`: `1791290720403` Unix ms (`2026-10-06T12:45:20.403Z`).
- Price response received: `1791290724721` Unix ms (`2026-10-06T12:45:24.721Z`).
- Evaluation: `1791290724736` Unix ms (`2026-10-06T12:45:24.736Z`).
- At evaluation: provider-data age 4,333 ms, observation age 15 ms; token LIVE, overall PARTIAL, verdict WAIT.
- Receipt SHA-256: `1d882a8f883b6718ec13f19c2a90e23b656ca5edc208fe7fc13854506bdc23f0`.

| Endpoint | HTTP / code | Latency ms | Response-envelope timestamp ms | AfterClose observation ms |
| --- | --- | ---: | ---: | ---: |
| platforms | 200 / 0 | 1178 | 1791290723401 | 1791290723461 |
| tokens | 200 / 0 | 1919 | 1791290723047 | 1791290724209 |
| search (`NVDA`) | 200 / 0 | 1323 | 1791290723595 | 1791290723619 |
| price | 200 / 0 | 482 | 1791290724673 | 1791290724721 |
| underlying-market | 200 / 0 | 474 | 1791290724678 | 1791290724716 |
| supported/chain (`56`) | 200 / 0 | 1177 | 1791290723395 | 1791290723476 |

RWA paths use `/api/v1/dex/market/rwa/`; chain discovery uses `/api/v1/dex/aggregator/supported/chain`. Signing includes `/build`. [Binance RWA documentation](https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/rwa-data) distinguishes token update time from response time and describes referencePrice as a token-derived per-share conversion. Neither reference endpoint establishes an independent NVDA quote. Undated references remain undated; the token clock is not copied onto them.

The final production-browser capture, using the credential-free build, at `2026-10-06T13:31:07.937Z` independently obtained `243.547028439769000074` USD/token. Provider price time was `1791293462372` (`13:31:02.372Z`); receipt time `1791293467542` (`13:31:07.542Z`). Ages at evaluation were 5,565 ms / 395 ms. All six endpoints again returned 200/0; token LIVE, overall PARTIAL, decision WAIT, scheduled regular session (authoritative state still UNKNOWN). The [browser-copied canonical receipt](browser-captured-evidence.json) hashes to `37f2feabcb8041124bace86309eff70b3323fb79c119d62f168e297bfdf096a0`. This committed record is also HISTORICAL after capture; its original classification must not be read as a current claim. Full final audits and screenshots are in [browser results](../qa/live-evidence/results.json).

## Temporal policy

`afterclose-freshness/v1` is a research policy, not an execution guarantee or a provider SLA:

| Type | Maximum provider age for LIVE | HISTORICAL starts at |
| --- | ---: | ---: |
| Token price | 60 seconds | 24 hours |
| Independent equity, if later connected | 60 seconds | 24 hours |
| Authoritative session, if later connected | 60 seconds | 24 hours |
| Dated multiplier, if later connected | 24 hours | 7 days |

All types additionally require observation age ≤30 seconds. Limits are inclusive; historical horizons are inclusive. Missing/invalid/future clocks, provider time later than observation, or absent values are UNAVAILABLE. Otherwise historical age takes precedence, then either exceeded limit produces STALE, otherwise LIVE. These thresholds were not fitted to the captured quote. A reported multiplier without an effective date is not a dated multiplier and cannot pass this policy. The calendar has its own seven-day manual-review limit.

Requests coalesce for 15 seconds per process, with no background polling and no clock rewriting. The page freezes age/classification at the displayed evaluation, warns after 30 seconds and offers explicit refresh. It never implies that an open browser tab continually receives market updates.

## Missing evidence stays missing

**Independent NVDA reference:** UNAVAILABLE. No independent provider credentials were obtained or quote APIs called. The engine still requires two distinct independent providers; one replacement feed would not satisfy it. See the researched options below.

**Multiplier:** the current official [Ondo page](https://app.ondo.finance/assets/nvdaon) again reported `1.0017152487959898`, observed at `1791290723604` ms. This was a fresh retrieval, not reuse of the old fixture, but it supplies no effective date/validity interval. The documented [history API](https://docs.ondo.finance/api-reference/assets/get-shares-multiplier-history-for-an-asset), `GET https://api.gm.ondo.finance/v1/assets/NVDAon/shares-multiplier?range=all`, returned 403 at `1791290725663` ms, 736 ms latency. No access workaround was attempted. `token price / verified shares-per-token` remains the formula; no live normalized price or gap is produced.

**Session:** manually re-reviewed [Nasdaq calendar](https://www.nasdaqtrader.com/Trader.aspx?id=Calendar) and [hours](https://www.nasdaq.com/market-activity/stock-market-holiday-schedule) at `2026-10-06T12:34:48Z`. The capture was scheduled premarket; authoritative state remained UNKNOWN. Calendar logic handles New York DST, holidays, weekends and early close. Beyond the reviewed coverage or review age it returns UNKNOWN; after an early close it does not invent extended-hours availability. Schedule and raw Binance status are excluded from authoritative engine session input.

**Execution:** no quote/simulation request was made. Current [Trading API docs](https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/trading-api) require chain, pair, amount and a receiver address for Ondo RFQ. The quote schema asks for a public address, not a wallet signature; actual acceptance/route availability remains untested. Subsequent RFQ execution requires the matching signing wallet, and approximate 30-second quote-cache lifetime is not an absolute execution guarantee. [Simulation docs](https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/transaction-api) require chain plus genuine EVM `from`, `to`, `value`, `data`. API HMAC authentication is distinct from wallet signing; no wallet signature field is documented for EVM simulation. No owner address or genuine unsigned transaction context was supplied, so no address/calldata was invented. Ownership was not proved or assumed.

## Zero-cost equity research, revisited October 6

No examined option is confirmed to satisfy current NVDA data, adequate event clocks, session coverage AND public-display rights for $0. This is an entitlement finding for this project, not a claim that every free feed is unlawful. Written hackathon permission could change it. Older detailed analysis remains in [provider research](../research/underlying-equity-providers.md).

| Provider / official sources | $0 timing and sessions | Timestamp semantics | Key, quota and entitlement | Public judging suitability |
| --- | --- | --- | --- | --- |
| [Massive](https://massive.com/pricing?product=stocks) | Basic EOD; no fresh regular/pre/after quote | Free aggregates date bars; entitled trades distinguish participant/SIP event clocks | Account/API key; Basic 5 requests/min; individual use | EOD fails freshness; public product needs appropriate business rights |
| [Twelve Data business](https://twelvedata.com/pricing-business), [extended hours](https://support.twelvedata.com/en/articles/5195429-pre-post-market-data) | Basic US real-time coverage is partial; real-time pre/post 07:00–20:00 ET requires Pro+; historical 04:00–20:00 is not current | quote.timestamp is interval opening; last_update_at association must be qualified before engine admission | Key; 8 credits/min and 800/day, endpoint weights apply; free business tier says internal non-display | No confirmed free public-display grant; educational eligibility is not assumed to grant redistribution |
| [Finnhub terms](https://finnhub.io/terms-of-service), [pricing](https://finnhub.io/pricing) | Regular real-time SDK capability exists; current free and pre/post entitlements unverified | Quote event semantics unverified from accessible official docs | Key; current free minute quota unverified because pricing rendered empty; terms state an additional 30 calls/sec ceiling | Personal plans prohibit redistribution without written approval; not admitted |
| [Alpha Vantage support](https://www.alphavantage.co/support/), [API docs](https://www.alphavantage.co/documentation/) | Ordinary free EOD; real-time and 15-minute-delayed US data premium; no verified free current pre/post | Global Quote trading date cannot date a current event; intraday clocks date bars | Key; ordinary free 25/day; educational/open-source exceptions require qualification | Cannot meet present freshness; public rights unconfirmed |
| [Alpaca data plans](https://docs.alpaca.markets/us/docs/about-market-data-api), [stream schema](https://docs.alpaca.markets/us/docs/real-time-stock-pricing-data) | Free Basic IEX real-time, not consolidated SIP; extended-session data depends on venue/channel, not guaranteed all-market coverage | Trade `t` is RFC3339 with nanosecond precision; bars have distinct semantics | Paper/live account and keys; Basic 200 historical calls/min, 30 streaming symbols; latest-15-minute historical restriction | Technically promising private research; public redistribution and exact pre/post coverage remain unconfirmed |

The [hackathon stack](https://www.bnbchain.org/en/hackathons/tokenized-stocks) supplies event-period Binance API access. No documented module inspected here establishes an independent equity-market source: general market data is token data, and the RWA reference is token-derived. Elevated limits or a sponsor feed require organizer confirmation; none was inferred or provisioned.

## Receipt and snapshot verification

Receipt version `afterclose-evidence-receipt/v1` contains raw evidence, independent clocks, audits, policy, asset, multiplier/session/reference/execution statuses and canonical engine input/result. Exact decimal strings survive; numeric conversion is identified separately. All important provider fields expose source/time/age/derivation/engine-use in the expandable inspector. Derived calendar/freshness/decision data is explicitly identified.

Canonicalization sorts object keys recursively, preserves array order and rejects non-finite/non-JSON values. SHA-256 hashes UTF-8 canonical JSON. The evaluation ID hashes the core before adding that ID, avoiding self-reference. Engine ID includes SHA-256 of the unchanged engine source with LF line endings. Reproduction requires the same schema and engine version. Digests prove consistency, not Binance authorship: this is not a provider-signed attestation, immutable ledger or tamper-proof external timestamp.

Run with Node 24:

```text
node --conditions=react-server --import tsx scripts/verify-evidence-receipt.ts docs/competition/captured-evidence.json 1d882a8f883b6718ec13f19c2a90e23b656ca5edc208fe7fc13854506bdc23f0
```

It accepts the saved envelope or copied canonical JSON and reconstructs the decision and digest. No credentials or network are needed. A changed value, clock, policy-derived result or verdict invalidates the original envelope.

Local snapshots live only in ignored `.tools/competition-snapshots/last-verified.json`, outside public assets. Writes serialize per process, validate receipt integrity, use atomic rename and reject older/equal captures. Reads reject malformed, oversized or modified records. Failures preserve the last success. Every snapshot display says HISTORICAL with its original capture time, age and digest. “Verified” means validated transport/identity and reproducible receipt, not complete investment evidence. Concurrent multi-process durable storage is not implemented; this milestone is single-process/local.

## Running and security

Use Node 24 and the existing owner `.env.local`. On this Windows machine set `NODE_USE_SYSTEM_CA=1`; TLS remains enabled. Then run `npm run dev` and open `/live`, or run `npm run build:live-safe` followed by `npm start` for production. The safe builder copies only allowlisted source/config files, hardlinks installed dependencies, excludes environment files and credentials, denies network, and copies successful output back to `.next`. Runtime alone loads the owner's credentials. `scripts/capture-live-evidence.ts` makes six Binance reads plus an Ondo asset read and history check, and persists sanitized evidence locally. No keys belong in NEXT_PUBLIC variables.

Synthetic mode is selected only by the exact server environment flag. The `/live` guard runs before provider/snapshot access, and request query/header/cookie input cannot enable live mode. Provider or credential failures show LIVE EVIDENCE UNAVAILABLE with an explicit Scenario Lab link. The 12 scenarios remain fictional, deterministic and disconnected from live receipts.

Pattern and exact owner-value scans cover tracked/untracked source plus `.next`, local logs, receipts, snapshots and generated assets. The exact scan includes binary files and UTF-8/UTF-16/URL/base64 encodings, prints only finding paths/counts, and never prints credentials. It found credential values in three ignored Turbopack cache files from the initial ordinary build, while the pattern scan missed those binary files. The affected cache was removed; persistent Turbopack build/dev caches are now disabled in `next.config.ts`, and the production build is repeated without credentials using `build:live-safe`. No match was found in browser bundles, receipts or other inspected artifacts. These scans are evidence of checked artifacts, not a guarantee against all possible encodings or future changes.

## Smallest hosting recommendation — research only

Recommend one separate **Render Free Node web service** for the full Next.js app, using this competition branch, server-only environment secrets, build `npm ci && npm run build:live-safe`, start `npm run start -- --hostname 0.0.0.0 --port $PORT`. This avoids another frontend/backend split and leaves the existing Pages fallback untouched. No account/service was created and cloud egress/authentication remains untested. The isolated builder currently hardlinks a normal installed dependency tree; a future host's linked dependency layout must be checked, not silently traversed.

[Render Free limits](https://render.com/docs/free): 750 instance hours per workspace/month, sleep after 15 idle minutes, roughly one-minute wake-up, ephemeral files (snapshots disappear on restart/sleep), bandwidth/build quotas, and possible suspension for excessive outbound API traffic. Use no payment method/paid upgrade, bounded manual refresh and quota monitoring; never promise uninterrupted judging. A durable snapshot backend is a later separate decision.

[Cloudflare Workers Free](https://developers.cloudflare.com/workers/platform/pricing/) permits 100,000 requests/day but 10 ms CPU/request. The earlier full-Next rehearsal exceeded that budget. A minimal Worker API may fit but needs measured CPU and replacing Node filesystem persistence; it is not a proven drop-in deployment. Sponsor-managed infrastructure is unverified. Existing static Pages cannot contain server secrets.

See [scorecard](judging-scorecard.md), [90-second path](90-second-demo-path.md), and [engineering log](../devex/live-competition-upgrade.md) for remaining competition work and validation.
