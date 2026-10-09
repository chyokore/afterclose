# Supabase cache repair and live gateway verification

**SUPABASE GATEWAY VERIFIED — READY FOR CLOUDFLARE INTEGRATION**

Verified 2026-10-09. Branch `codex/supabase-cache-repair`, based on `be4f3fbc560ea76ea54d060eca063875d5adaf68`. Deployed source commit `39480fbd2776d2c0c0665b87668b077e154a8065`, clean build; source digest `0eaec54a7c6367bf0e855f215c884ea4f7d9c48d6c76d503ee385c7cb9ac1286`; isolated bundle 494,452 bytes, no source maps. Existing project `afterclose-frankfurt`, function `live-evidence`, region `eu-central-1`. No merge or frontend integration.

## Original HTTP 503: diagnosis before source changes

The old Gate B adapter was deliberately a validation-only adapter. Its `/validate` path populated a closure-local `captured` value; the public root never performed a capture. The root returned a canonical unavailable observation with reason `configuration` whenever that local value was absent **or** 30 seconds old. That branch did not inspect credential availability and did not use the canonical gateway's normal cache loader or failure cooldown.

The saved first and repeat response metadata establish:

- Identical deployed commit `9a2afb88294ee9334f0add958e5c8f3d3ae07caf` and source digest; both routed to Frankfurt.
- First successful evaluation: `1791492478559`; repeat unavailable receipt evaluation: `1791492479443`, only 884 ms later. A 30-second expiry cannot explain this.
- Repeat HTTP 503 contained the application schema, canonical unavailable receipt and `configuration` reason, not a platform error payload.
- Archived Supabase logs show boots at `1791492477233000` and `1791492479426000` microseconds with distinct execution IDs `d90338c2-c648-42fe-8230-c7f2993d9065` and `9b53a3d0-6304-4546-8996-7560540e279d`. These align with the two evaluations.

The combined code, timestamps, response and boot evidence establishes the practical cause: the repeat ran without the first worker's in-memory capture, and the old cache-only root intentionally failed closed with a misleading configuration label. There was no request-dependent cache key, no failure-cooldown branch, no region mismatch, and no credential check capable of causing that response at that location. The prior successful authentication did not imply memory would survive across requests. These saved logs were inspected before editing source; the dashboard's current-hour view alone no longer covered the previous day's event.

## Isolate model and minimal repair

[Supabase's limits](https://supabase.com/docs/guides/functions/limits) state that a worker can serve multiple requests during its lifetime. Its [worker lifecycle documentation](https://supabase.com/docs/guides/troubleshooting/edge-functions-worker-timeouts-and-websocket-drops) also permits retirement after a response when no background work remains. Neither provides request affinity or shared JavaScript memory across different workers. The design therefore requires correctness on every cold worker; it does not keep workers alive artificially.

The new Supabase adapter maps the fixed function URL to the existing canonical `createGateway` path. It preserves the existing deployment-mode checks, Binance signing implementation, metadata cache, observation pipeline, canonical engine and receipt schema. It replaces the temporary validation-only deployment; old validation and egress-diagnostic paths return 404.

The only changes to the shared cache/gateway are optional cache-read reporting and a failure-cooldown extension when the provider supplies a longer `Retry-After`. The normal 30-second success and minimum 60-second failure policies remain unchanged.

| Situation | Behavior |
| --- | --- |
| Empty or expired local cache | `MISS`; perform one genuine permitted evaluation. Success returns HTTP 200. |
| Fresh local entry | `HIT`; return the original observation and recompute the canonical receipt at response time. |
| Capture already running | `COALESCED`; await that capture in this worker; no duplicate evaluation. |
| Failed capture in cooldown | `FAILURE_COOLDOWN`; truthful HTTP 503 with provider/configuration reason and remaining `Retry-After`. No synthetic fallback. |
| Missing credentials/configuration | Explicit configuration-unavailable response before provider access. |
| Local request limit exceeded | HTTP 429 `INSTANCE_RATE_LIMIT`, `Retry-After: 60`, no provider capture. |
| Unknown/non-Frankfurt runtime | HTTP 503 `HOST_REGION_UNVERIFIED`, no provider access. |

Safe response headers identify cache outcome, Frankfurt region and new Binance calls initiated by that request. Coalesced readers report zero newly initiated calls. Safe logs contain only response status, cache outcome, call count and region. No URLs, request headers, credential values or environment dump are logged.

The additional transport guard allows only the existing six Binance paths and the existing Ondo asset page, GET with redirects disabled, in Frankfurt. Each worker allows at most six Binance requests and one issuer request per 30-second window. The existing inbound limit remains 120 requests/minute/worker. Provider `Retry-After` seconds or HTTP-date is honored; HTTP 429 imposes at least 60 seconds. Provider code `42900` follows the canonical failed-observation cooldown. No automatic provider retries were introduced.

Shared Postgres/Redis/KV storage is not required for this bounded demo's correctness. The limitations are explicit: caches, coalescing and budgets are **per worker**, not global. Multiple cold workers can each evaluate. Provider-wide quotas cannot be guaranteed by in-memory controls, and CORS is not authentication against non-browser callers. No global quota or load-test claim is made. There was no observed provider rate limit requiring new shared infrastructure, so none was added.

## Timestamp and receipt guarantees

A hit retains the original provider time, observation time, evidence values and provenance. Receipt evaluation time advances; ages are recomputed rather than refreshed by rewriting observations. Unchanged observation **and** unchanged evaluation/calendar inputs produce identical canonical JSON and digest. A later evaluation time changes receipt content and legitimately changes the digest, even on a hit.

On a genuine miss, a new provider request establishes a new observation time. The provider may return an unchanged price timestamp; that time is retained. Old provider data is still classified stale/historical even when the network request is new. Expired cache entries are refreshed or fail closed, never silently relabeled LIVE.

All receipts are independently reproducible through the unchanged canonical local engine. WAIT, MONITOR, PROCEED_TO_REVIEW and all evidence requirements are unchanged.

## Deterministic verification

The repository uses Node's test runner via `tsx`, not Vitest; its full existing TypeScript suite was run rather than introducing another runner. **166 passed, 0 failed**. New grouped regressions cover all requested behaviors: first capture, same-worker hit, both timestamps, age progression, expiration, independent-worker miss, permitted refresh, provider failure, cooldown, concurrency, request/transport limits, WAIT, verifier/digests, allowed/denied CORS, methods, fixed inputs and reflected credentials. Provider fault injection used local doubles only.

An additional smoke test imported the actual bundled runtime with a read-only environment and fake transport: first response HTTP 200/MISS/six calls; immediate repeat HTTP 200/HIT/zero calls. This is a local runtime test, **not hosted cache-hit evidence**. TypeScript and ESLint passed; isolated gateway build succeeded. All 12 synthetic Scenario Lab cases and frontend sources were left untouched.

## Controlled hosted verification

Current credential-free health at `2026-10-09T11:40:54.158Z` confirmed the previous function still in Frankfurt. After the single repair deployment, build/region preflight at `1791546227921` confirmed the exact new commit/digest, runtime `eu-central-1`, platform `x-sb-edge-region: eu-central-1`, exact production CORS, unauthorized-Origin rejection and disabled diagnostics. This is consistent with the prior two-source German egress verification; **no new egress-IP geolocation was performed or claimed**.

Exactly two live requests were then made sequentially, without retries, forced cold starts, extra deployments or a separate authentication probe. Each response was independently verified before proceeding. The [machine-readable report](supabase-cache-repair-evidence.json) records safe metadata and digests. Captured [first](supabase-cache-repair-first-receipt.json) and [repeat](supabase-cache-repair-repeat-receipt.json) receipts are historical audit artifacts, not application fallback data.

| Evidence | First request | Immediate repeat |
| --- | --- | --- |
| HTTP / cache | 200 / MISS | 200 / MISS |
| Runtime / platform region | eu-central-1 / eu-central-1 | eu-central-1 / eu-central-1 |
| Binance calls | 6 | 6 additional |
| All six endpoint results | HTTP 200, code 0 | HTTP 200, code 0 |
| Total round-trip latency | 2,174.41 ms | 1,958.89 ms |
| Provider token-price timestamp | 2026-10-09T11:44:26.327Z | 2026-10-09T11:44:26.327Z |
| Token observation timestamp | 2026-10-09T11:44:29.519Z | 2026-10-09T11:44:31.852Z |
| Receipt evaluation timestamp | 2026-10-09T11:44:29.535Z | 2026-10-09T11:44:31.858Z |
| Provider / observation age | 3,208 ms / 16 ms | 5,531 ms / 6 ms |
| Freshness at evaluation | LIVE | LIVE |
| Completeness / verdict | PARTIAL / WAIT | PARTIAL / WAIT |
| Receipt verifier / local equivalence | PASS / byte-identical | PASS / byte-identical |

Both rediscovered NVDAon: MATCH, Ondo, NVDA, BSC 56, `0xa9ee28c80f960b889dfbd1902055218cba016f75`. Both captured `234.386342489529673353` USD/token at the exact times above. This is not a timeless/current price claim.

Hosted logs correlate first execution `288f84f6-9862-4d0a-bdf3-63ed1b43ac0a` and repeat execution `dbf45cc4-6660-4d1f-83cb-b303cbbe49f0`, each with a separate boot and a status-200/MISS/six-call event. Thus **fresh-worker fallback was verified on the real platform**, not merely inferred from a missing HIT header. No hosted hit or zero-call repeat is claimed. Total authenticated hosted Binance calls: **12**; existing issuer page requests: **2**. Six function invocations were made by the verification workflow in total, including four credential-free health/CORS/diagnostic checks.

First SHA-256: `fc7bd8ca5b3112e69725674830501e6b8c74769805b2beebd24ab44fba815402`.

Repeat SHA-256: `0be6bf4400510a64727c20f9b5adbb6e455ca18259d1fc797e1cdc62ce800675`.

The two digests appropriately differ because observations and evaluation inputs differ. Local replay matched each independently. Canonical engine identity remains `reference-truth/v1:0b8daa72d38484ed6c6e4ea5e89213029c3c47f97bfcccdca6a7aa67e6cc669b`.

The verdict still blocks on missing underlying, multiplier, session and order evidence (`MISSING_EVIDENCE`), `MISSING_LIQUIDITY`, `MISSING_QUOTE`, `MISSING_CORROBORATION` and `GAP_UNAVAILABLE`. Independent NVDA reference remains unavailable, multiplier applicability unverified, authoritative session unknown and execution disabled.

## Security, costs and retained deployment

Exact local-credential comparisons run only in scan-process memory found zero matches in source, bundle, public responses, receipts, metadata and exported logs. Additional transport-artifact scans found no signature values, signing/authentication-header objects, signed URLs, privileged Supabase tokens or private keys. Server signing source contains necessary header names but no embedded values. No source maps or environment dump exist in the bundle. Eleven exported runtime log rows were included in the audit. Credentials were neither changed nor read back from Supabase.

The dashboard after tests still shows Free Plan, spending restrictions enabled, no overage, 33/500,000 displayed invocations, rounded 0.00/5 GB egress, and baseline database size 0.026/0.5 GB. Usage can lag one hour: 33 is a displayed counter, not the exact final invocation total. No paid resources, payment methods, overages, cache service, database changes or networking purchases were introduced.

The repaired gateway remains deployed; safe health is available, validation/egress diagnostics are disabled, and public frontend integration is still deferred. Cloudflare and Netlify deployments were unchanged. Wallet signing, trading simulation and broadcast: NONE; only existing Binance request authentication signatures were used. No main-branch merge.

Remaining risks are platform cold-start latency, provider availability/quotas, per-worker rather than global throttling, and normal incomplete evidence leading to WAIT. These do not require a cross-worker cache hit under Prompt 27's acceptance criteria. No cache-correctness or receipt blocker remains for the next authorized frontend integration milestone.
