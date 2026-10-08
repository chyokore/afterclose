# Supabase Frankfurt Gate B validation

Status: **SUPABASE GATE B FAILED — DO NOT INTEGRATE**. Frankfurt authentication, the single live evaluation, canonical receipt verification, and local equivalence passed. The required immediate hosted repeat returned a cache miss; a hosted cache hit with preserved observation timestamps and naturally increased age was not demonstrated. This is a cache/readiness failure, **not an authentication failure**. No more provider calls were made to force a hit.

Branch `codex/supabase-binance-live`, base `1fc758cdf744e0e767e4ee2d8a037632cae23f4c`. Project `afterclose-frankfurt` (`wakuqrnxjwikvlrxgezg`). Cloudflare and Netlify unchanged.

## Local credential precheck

One actual authenticated `platforms` call on 2026-10-08: HTTP 200, provider code `0`, latency 1,935 ms. Observation timestamp `1791490637692`; provider response timestamp `1791490638589`; check completed `2026-10-08T20:17:17.697Z`. TLS verification stayed enabled using the system CA store. Credentials were read solely inside the existing local process; no values, signed URLs or auth headers were emitted.

The first script attempt failed in TypeScript/CommonJS environment-loader interop **before any provider call**. A separate no-network setup check established this, then the import was corrected using `createRequire`. There was exactly one actual local provider request, not a retry of a failed authentication request.

## Fresh region precheck before secret entry

One credential-free diagnostic invocation at `2026-10-08T20:21:09.288Z` returned HTTP 200. Runtime `SB_REGION` and `x-sb-edge-region` both reported `eu-central-1`. Both geolocation services observed the same new IPv6 address `2a05:d014:61b:270b:3183:7076:2940:544e`:

- IPWhois: DE, Hessen, Frankfurt am Main, ASN 16509, Amazon Data Services Ireland Ltd; 30.50 ms outbound.
- ipapi: DE, Hesse, Frankfurt am Main, AS16509, Amazon.com, Inc.; 240.88 ms outbound.

Total diagnostic latency: 2,306.68 ms. Classification: observed VERIFIED_NON_US, Germany. The address changed since Gate A, reinforcing that historical egress is not permanent proof. Today's [Binance prohibited list](https://web3.binance.com/en/dev-docs/web3-api-prohibited-regions) does not list Germany; this is not a guarantee of API access or account eligibility.

Temporary diagnostic used the existing credential-free Gate A adapter, with zero Binance calls. Removal was verified at `2026-10-08T20:23:58.552Z`: HTTP 404, `DIAGNOSTICS_DISABLED`, runtime Frankfurt. At that handoff the locked deployment was commit `4bfb29849ce4ba3a1b9363eaf5862daeefa30813`, source digest `6aac02b067cfd70b2123174e49617403009ef650644c3affe119fb5baeb89bfa`. Adding secrets alone could not trigger Binance requests. Secret-name inspection before handoff showed no custom secrets.

## Owner entry, bounded deployment and pre-probe checks

Owner confirmed private entry on 2026-10-08. Required names `BINANCE_API_KEY` and `BINANCE_SECRET_KEY` were both verified in the refreshed dashboard listing. No hosted values were retrieved, displayed, or hashed. The owner's confirmation establishes that this is the locally validated pair.

The bounded adapter requires an expiring private validation permit, exact production Origin, and runtime `eu-central-1`. An exclusive local invocation ledger prevents accidental client retries. The network guard permits each of the six existing Binance paths once, plus the existing Ondo issuer page once, only while validation runs. A failed probe cannot start evaluation. Successful discovery is memoized and reused. The public root is cache-only and cannot trigger a new capture. This is validation infrastructure, not a public live rollout.

An initial startup failed because Supabase prohibits environment mutation. Four credential-free public checks returned platform-generated HTTP 500 responses before any provider request. The corrected adapter reads only the required two values into a private read-only process facade; it does not mutate or enumerate Supabase's environment. A read-only environment smoke test passed with zero outbound requests. No engine, signing algorithm, region, runtime, gateway receipt contract, or production CORS change was made.

Validated deployed source: `9a2afb88294ee9334f0add958e5c8f3d3ae07caf`, clean tree; source digest `346384cc28f852618a58d43ef9bef6cffa5b01c9190ccc58e0d98969ce0afd28`. Deployment was confirmed by its public build identity at `2026-10-08T20:47:22.942Z`, before the probe. Public health returned 200, diagnostics 404, unauthorized Origin 403 without Allow-Origin, and the uncaptured root 503. The only allowed Origin was `https://afterclose-preview.pages.dev`. The initial platform-generated wildcard error responses were resolved before authentication; the working adapter never returns wildcard CORS.

## One authenticated probe and one evaluation

**FRANKFURT BINANCE AUTHENTICATION VERIFIED**. Exactly one hosted `platforms` call returned HTTP 200, code `0`, in 273 ms. Provider response time: `2026-10-08T20:47:57.404Z` (`1791492477404`). Hosted observation: `2026-10-08T20:47:57.524Z` (`1791492477524`). Both runtime identity and response header reported `eu-central-1`.

Only after this success, one canonical evaluation ran in the same invocation, reusing platforms. All six Binance modules returned HTTP 200/code `0`: platforms, tokens, search, price, underlying-market, chain-list. Total authenticated hosted Binance calls: **6**, including the probe; additional duplicate discovery calls: **0**. The existing Ondo page was requested once. No new independent provider was added.

| Endpoint | Latency ms | Provider response timestamp | Observation timestamp |
| --- | ---: | ---: | ---: |
| platforms | 273 | 1791492477404 | 1791492477524 |
| tokens | 773 | 1791492477684 | 1791492478299 |
| search | 476 | 1791492477887 | 1791492478002 |
| price | 246 | 1791492478436 | 1791492478552 |
| underlying-market | 251 | 1791492478439 | 1791492478557 |
| chain-list | 247 | 1791492477657 | 1791492477774 |

Live NVDAon discovery: **MATCH**, Ondo, NVDA, BSC 56, contract `0xa9ee28c80f960b889dfbd1902055218cba016f75`, decimals 18. This derives from the returned discovery, not a hardcoded result.

**Captured live observation:** `231.339458273870121446` USD/token. Provider token-price time: `2026-10-08T20:47:56.250Z` (`1791492476250`). Observation time: `2026-10-08T20:47:58.552Z` (`1791492478552`). Evaluation time: `2026-10-08T20:47:58.559Z` (`1791492478559`). At evaluation, provider age was 2,309 ms and observation age 7 ms; freshness was LIVE. This is a timestamped capture, not a continuing current-price claim.

Canonical completeness: **PARTIAL**. Verdict: **WAIT**. Blocking codes: `MISSING_EVIDENCE` (underlying, multiplier, session, order), `MISSING_LIQUIDITY`, `MISSING_QUOTE`, `MISSING_CORROBORATION`, `GAP_UNAVAILABLE`. Independent reference remains UNAVAILABLE, multiplier applicability UNVERIFIED, authoritative session UNKNOWN, execution DISABLED. No comparable normalized gap exists. No missing evidence was fabricated.

## Receipt and local equivalence

The [captured canonical receipt](supabase-gate-b-receipt.json) is sanitized provider evidence, not a live fallback. Verifier: PASS. Local replay of the same normalized observation, evaluation time and calendar review produced byte-identical canonical JSON and the same SHA-256 digest:

`a6414ef0546196a9f10c8d8482c34360df4ed146b88874f59876abbbf7d01c60`

Engine identity remains `reference-truth/v1:0b8daa72d38484ed6c6e4ea5e89213029c3c47f97bfcccdca6a7aa67e6cc669b`. Build identity is carried by the enclosing gateway response and recorded above. All six transport audits are verified. See [sanitized validation evidence](supabase-gate-b-evidence.json).

## Cache test and latency

Exactly one immediate repeat gateway request returned HTTP 503, configuration unavailable, with no HIT header. It reached Frankfurt but did not have the prior instance's captured observation. This is consistent with a new isolate; there is no cross-instance cache. The cache-only route made **zero additional Binance calls**. No cache-hit latency or hosted age-preservation success is claimed. Local adapter tests prove same-instance timestamp retention and natural age increase, but cannot substitute for the missing hosted demonstration.

- Probe: 273 ms provider request.
- Evaluation after successful probe: 1,040.96 ms (includes canonical receipt work).
- Complete validation round trip: 2,824.87 ms.
- Immediate repeat: 351.35 ms, **cache miss**, not cached-success latency.

No waits or repeated live evaluations were used to force a cache hit. A safe cross-request cache strategy and its hosted verification require a subsequent authorized milestone; no database or paid resource was added to solve this.

## Security, cleanup, usage and scope

The final exact-value scan covered 248 files (including binary artifacts), loaded local credentials only into scan-process memory, and found zero matches across source, both deployment bundles, response/receipt/error artifacts, public metadata, and the 27 exported runtime log rows. Additional scans found zero signed URLs, signature values, authentication-header objects, service-role tokens or private keys in transport artifacts. Server signing source necessarily contains header *names*; no corresponding runtime values are serialized. No source maps, UI bundle, environment file, or environment dump is deployed. Hosted secret values were never read back.

Temporary validation was disabled after the single evaluation. At `2026-10-08T20:50:16.912Z`, `/validate` returned 404 `VALIDATION_DISABLED`, `/diagnostics` returned 404 `DIAGNOSTICS_DISABLED`, and safe `/health` returned 200. The retained clean source commit remains `9a2afb88294ee9334f0add958e5c8f3d3ae07caf`, disabled bundle source digest `ad0d623d085ab884146e2af382fffdaaa1ca611fc64dc916921f6dec621f0c69`, 494,648 bytes. Public health exposes only service availability, mode, safe region and build identity. The retained root cannot start provider work.

Actual dashboard after validation: Free Plan; spend cap enabled; no overage billing; 1 existing project; 22/500,000 displayed Edge Function invocations; 0.00/5 GB rounded egress; 0 overage; database baseline 0.026/0.5 GB. Counters can lag one hour, and do not establish an exact final invocation total. The local run records 15 Gate B invocations including regional prechecks, four failed startup checks, four corrected public checks, one validation, one repeat, and three cleanup checks. No charges or paid resources were introduced. Invoice rows did not populate, so a complete invoice-ledger audit is not claimed.

Cloudflare frontend and Netlify were not modified or connected. Wallet signing, transaction simulation and broadcast: NONE. Binance request authentication used the existing API signing code only. No merge.

Validation: 95 canonical, receipt, gateway, CORS, client-security and Supabase adapter tests; read-only runtime startup smoke check; ESLint; TypeScript; exact credential and transport-artifact scans. Original observation timestamps remain in the committed receipt. No further provider call is authorized by these test commands.

Final readiness: authentication and evidence pipeline proven in Frankfurt; complete Gate B acceptance **not achieved** because the hosted cache hit/age check remains unverified. Keep public integration disabled.
