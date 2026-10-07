# Zero-cost live gateway feasibility

Reviewed 2026-10-07. Scope: research, extraction, local rehearsal and benchmark only. **CONDITIONAL GO** for architecture B. Netlify's documented credit-based Free plan passes the financial requirement. The local implementation passes; hosted packaging, runtime/region connectivity and cold-start behavior remain unverified until a separately authorized deployment. No Netlify account or project was created. Render and the deployed Cloudflare preview were untouched.

## Official plan facts

| Question | Finding and source |
| --- | --- |
| Price / monthly credits | Credit-based Free is $0/month with 300 credits and no auto recharge. [Current plan documentation](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/) |
| Hard stop / financial exposure | Free cannot generate usage overages. At exhaustion the team's projects and deploys pause; wait for reset. Purchasing credits requires an explicit paid upgrade. [Pause rules](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/) and [current pricing FAQ](https://www.netlify.com/pricing/) |
| Payment card | Netlify's official [Free announcement](https://www.netlify.com/blog/introducing-netlify-free-plan/) explicitly says no card required. That 2024 article's numerical quotas are legacy and are NOT used here. Current pricing confirms Free has no costs; the actual signup path has not been exercised. Stop if it requires payment or selects a paid/legacy plan. |
| Functions | Available on Free; consumption shares the credit pool. No separate free invocation quota is assumed. [Credits](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/) |
| Duration / memory | Synchronous functions: 60 seconds, 1024 MB default; configurable memory 1024–4096 MB. This handler specifies 1024 MB. Buffered request/response limit 6 MB; our own response cap is 128,000 bytes. [Function configuration](https://docs.netlify.com/build/functions/configuration/) |
| Node | Native `.mjs` Request/Response handler. Official configuration documents `AWS_LAMBDA_JS_RUNTIME=nodejs24.x`; set via UI before deploying. Local build/test uses Node 24.21.0 and targets Node 24. [Runtime configuration](https://docs.netlify.com/build/functions/configuration/#nodejs-version-for-runtime) |
| Secrets | UI-managed runtime environment values, read through `process.env`. Fine-grained variable scopes require Pro; do not claim Functions-only scope on Free. Values are applied at deploy time; changing them requires a new deploy. Never put values in TOML. [Environment variables](https://docs.netlify.com/build/functions/environment-variables/) |
| Outbound HTTPS | Node functions support external `fetch`, demonstrated in Netlify's [official Functions examples](https://www.netlify.com/platform/core/functions/). This does not prove Binance permits the eventual Netlify egress region/IP. |
| Usage accounting | Compute 10 credits/GB-hour; bandwidth 20/GB; web requests 2/10,000. Successful production deploy 15 credits; preview/branch deploy 0 deployment credits. Runtime traffic still counts. Build minutes no longer form a separate credit meter. [Credit accounting](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/) |
| Cold starts / sleep | On-demand execution and recycled instances imply cold starts and cache loss. No fixed idle interval, latency guarantee or persistent warm cache was found in the reviewed official configuration. Local cold capture is NOT a hosted cold-start measurement. |
| Git / direct deployment | Git integration is optional. Authenticated CLI manual deployment accepts publish and functions directories; default is a draft. The CLI packages Node dependencies. Use only a prebuilt isolated folder, not this full Next repository. [CLI manual deploy](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/#manual-deploys) |

The intended configuration has no paid upgrades, add-ons, domains, AI services, database or storage. A different plan or a payment-required flow invalidates this assessment. Exhaustion remains an availability risk, including from abuse, even though it cannot become a Free-plan usage bill.

## Architecture comparison

Scores: 5 best, 1 worst. These are engineering judgments for this project, not vendor guarantees. All assume verified credit-based Free.

| Criterion | A: full Next on Netlify | B: Cloudflare static + function | C: separate minimal static UI + function |
| --- | ---: | ---: | ---: |
| Financial risk | 5 | 5 | 5 |
| Secret safety | 2 | 5 | 5 |
| Implementation effort | 2 | 4 | 4 |
| Function compute | 2 | 5 | 5 |
| Bandwidth | 2 | 5 | 4 |
| Build/deploy usage | 2 | 5 | 4 |
| Cold-start behavior | 2 | 4 | 4 |
| Judge reliability | 2 | 5 | 4 |
| Integration depth | 5 | 5 | 2 |
| Deployment simplicity | 2 | 4 | 3 |
| Total / 50 | 26 | **47** | 40 |

A was evaluated on paper only, not built or deployed. It expands server/client boundaries and repeats the prior framework build-cache risk. B retains the existing independent offline experience and sends only evidence through Netlify. C is useful as this local proof of integration but would fragment the final judge experience. Recommend B after hosted verification.

## Extracted execution path

`gateway/function.ts` is a native Netlify entry with a literal path/memory configuration. `gateway/handler.ts` validates requests, uses the existing `observeCompetition` pipeline with cached operations, and calls `createEvidenceReceipt`. The unchanged Reference Truth Engine remains the only decision implementation. Instrumentation records numeric timings inside an optional AsyncLocalStorage scope; no secrets, request headers or provider payloads enter profiling.

The isolated build emits a small entry plus a bundled library under `.tools/gateway-package`, with only a harmless informational page in `public`. No React, Next runtime, fixtures, Scenario Lab, screenshots, docs, filesystem snapshot store or environment files are included. Native imports are `node:crypto` and `node:async_hooks`; Zod supplies canonical validation. The build does not load `.env` or execute the pipeline. It retains a commit, dirty flag and input-source fingerprint rather than claiming uncommitted code was built from the base commit alone.

Only `GET /api/live-evidence`, without query parameters, is accepted. No arbitrary contract, chain, URL or provider endpoint is accepted. The original transport policy restricts Binance calls to the approved NVDAon/BSC 56 paths. The usual Netlify `/.netlify/functions/…` alias is rejected by the handler's path check. Missing mode/credentials, conflicting modes, bad provider responses and unsafe reflected values fail closed with `LIVE_EVIDENCE_UNAVAILABLE`.

## Request schedule and timestamp truth

| Operation | Classification | Lifetime |
| --- | --- | --- |
| Binance price + underlying market | Per uncached refresh | Fetch together after successful discovery; original token-price and observation clocks retained |
| Binance tokens + NVDA search | Cacheable identity metadata | 5 minutes |
| Binance platforms + supported chains | Startup / rare metadata | 60 minutes |
| Existing anonymous Ondo observation | Cacheable supplemental evidence | 5 minutes; original observation and unverified multiplier semantics unchanged |
| Complete observation | Per-instance shared cache | 30 seconds after successful capture; 60 seconds after failure |

Cold successful evaluation: six Binance calls plus one existing Ondo request. Warm uncached evaluation: two Binance calls. At the discovery TTL: four; at all metadata expiries: six. Cache hit: zero. Expired metadata is never served as an error fallback. Reused audits keep the exact original observation times; each response re-evaluates the original evidence at the new evaluation time. Provider timestamps are never replaced by fetch time. No historical disk snapshot is used.

The typed response wraps the canonical receipt once, its digest, build identity and cache policy. The receipt contains normalized asset/price evidence, every field's provenance and clocks, freshness, missing independent reference, unverified multiplier, unknown authoritative session, NOT_RUN execution, blockers and canonical engine identity. No redundant canonical-JSON string or second top-level copy of the evidence is transmitted. Canonical receipt structure itself remains unchanged for equivalence.

## CORS and abuse controls

Production allows exactly `https://afterclose-preview.pages.dev`. Local rehearsal allows only `http://127.0.0.1:4173` and `http://localhost:4173` in development. Missing, `null`, wildcard-lookalike and other origins are rejected. ACAO is never `*`; responses use `Vary: Origin`, `no-store`, no credential allowance, and no browser secret. Simple GET needs no preflight; other methods and unexpected authorization/content-type headers are rejected.

In-flight capture is coalesced. At most 120 admitted requests/minute/instance; further requests receive 429 and Retry-After. Existing Binance calls have a 12-second timeout, fixed GETs, no redirects/retries, and 2 MB body bounds; two sequential phases bound upstream wait to roughly 24 seconds. Existing Ondo observation has an 8-second bound and overlaps capture. Browser wait is 30 seconds. Output is capped at 128,000 bytes.

CORS is a browser policy, NOT authentication. A direct client can spoof Origin. In-memory cache/throttle is neither global nor durable; instances can scale or restart, so this cannot enforce a team-wide provider quota. Rejected invocations and abusive traffic still consume host resources. The Free hard limit is the financial backstop. No claim of a distributed rate limiter or guaranteed uptime is made.

## Local benchmark — genuine provider calls

Five uncached captures, 31 seconds apart on this Windows host, each followed by a verified immediate cache hit. All five were HTTP 200, `LIVE`, `PARTIAL`, `WAIT`; all five digests matched canonical regeneration from the identical observations and evaluation times. Binance requests: 6, 2, 2, 2, 2; Ondo: 1, 0, 0, 0, 0. All five cache checks made zero provider calls and retained the identical observation. No mock data was used for these measurements.

| Measurement | Median | p90 | Max |
| --- | ---: | ---: | ---: |
| End-to-end wall / response time, ms | 1102.276 | 3463.998 | 3463.998 |
| Process CPU, ms | 47 | 704 | 704 |
| Binance request-to-headers sum, ms | 2175.807 | 7187.098 | 7187.098 |
| Binance body-read sum, ms | 0.574 | 746.006 | 746.006 |
| Binance JSON parsing, ms | 0.078 | 4.848 | 4.848 |
| Canonical engine, ms | 0.220 | 3.796 | 3.796 |
| Receipt generation, ms | 4.865 | 118.433 | 118.433 |
| Canonical JSON for digest, ms | 1.735 | 1.961 | 1.961 |
| SHA-256, ms | 0.282 | 0.372 | 0.372 |
| Response serialization, ms | 0.110 | 0.127 | 0.127 |
| Response bytes (source handler identity) | 12671 | 12683 | 12683 |

Nearest-rank p90 equals max at n=5; this is a small feasibility sample, not an SLA. Network sums overlap concurrent requests and cannot be added to wall time. Receipt time includes engine/hash/canonicalization; CPU is process CPU with Windows measurement granularity (one sample reported zero), not billed compute. Cold local capture was 3.464 s; median of four warm captures was 0.826 s. Hosted TLS/network/initialization can differ. A genuine packaged-function smoke response measured 12,769 bytes including its real build identity; the budget below reserves 16 KiB per response.

## Estimated monthly consumption

Assume four gateway GETs per judge: one cold capture, one warm uncached refresh, two same-instance cache hits budgeted at 50 ms each (assumption). Use measured 3.464 s cold and 0.826 s warm, 1 GB allocated memory, 16 KiB per response, one production deploy. Static UI traffic stays on Cloudflare and is not included in Netlify credits. No retries, polling, other team projects or paid services. Cache hits still invoke the function. Actual billing/rounding and cold starts must be measured later.

| Sessions | Invocations / web requests | GB-hours | Bandwidth GB | Compute credits | Bandwidth credits | Request credits | Deploy credits | Total credits |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 10 | 40 | 0.01219 | 0.000655 | 0.122 | 0.013 | 0.008 | 15 | **15.14** |
| 100 | 400 | 0.12194 | 0.006554 | 1.219 | 0.131 | 0.080 | 15 | **16.43** |
| 1,000 | 4,000 | 1.21943 | 0.065536 | 12.194 | 1.311 | 0.800 | 15 | **29.30** |
| 10,000 | 40,000 | 12.19425 | 0.655360 | 121.943 | 13.107 | 8.000 | 15 | **158.05** |

Formula: credits = 15 + GB-hours × 10 + GB × 20 + requests / 5,000. GB is estimated as 10^9 bytes; no compression discount. Additional successful production deploys add 15 each; local builds consume no Netlify credits. No separate build-minute charge is added.

Stress case: all four requests cost the measured cold duration, with no cache benefit. Totals become 15.41 / 19.06 / 55.60 / **421.00** credits. The 10,000-session case would pause before completion on Free, not incur a bill. Long timeouts or hostile traffic could exhaust credits sooner. Even the optimistic estimate is not a capacity guarantee.

## Decision and remaining gates

**CONDITIONAL GO.** The intended Free configuration meets the no-automatic-charge requirement and B works locally. Before public use: (1) owner confirms a credit-based Free team with no payment requirement or add-ons; (2) separately authorized minimal draft verifies Netlify packaging, Node 24, custom path, configured environment, Binance egress and cold-start latency; (3) only after those pass, authorize one production gateway and the separate Cloudflare integration. No full Next deployment is proposed.

See [owner checklist](netlify-owner-checklist.md), [integration plan](cloudflare-live-integration.md), and [validation record](zero-cost-gateway-validation.md). These gates require later authorization; nothing in this milestone grants it.
