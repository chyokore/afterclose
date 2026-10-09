# Cloudflare public live integration — release record

Prompt 28, October 9, 2026. Branch `codex/cloudflare-live-integration`, exact base `e4ffdb891b13558e257420441223f2bf4a2ba24d`. **Public live frontend promoted and verified.** Deployed frontend and gateway source: `8eba2c989e881dbd2db83402c5cdd4a6602c8030`. Later commits record evidence/documentation and add a read-only release checker; they do not alter deployed application code. No main merge.

## Scope and rollback

Cloudflare project `afterclose-preview` stays static. Supabase project `wakuqrnxjwikvlrxgezg` stays in Frankfurt. Existing authentication and secrets are unchanged. The canonical engine and receipt files are unchanged. Netlify is untouched.

Before promotion, preserve synthetic-only production deployment `0bd20e4d-c861-4ee0-898f-ea43c579fc44` / source `538b119`, immutable URL https://0bd20e4d.afterclose-preview.pages.dev and frozen local artifact `.tools/pages-release/dist`. Existing production branch is `codex/static-synthetic-preview`. Use Cloudflare deployment rollback to that deployment, or redeploy the preserved artifact to that existing production branch. Do not rebuild rollback from the new source.

Staging uses https://live-staging.afterclose-preview.pages.dev on the same project. Gateway CORS accepts only that exact origin and https://afterclose-preview.pages.dev; arbitrary preview aliases remain denied. Region selection remains `forceFunctionRegion=eu-central-1` and runtime region is independently checked before provider work. No authorization header or key is needed from the public browser; Supabase JWT verification was already disabled under prior owner authorization and is not changed here.

## Frontend safeguards

One explicit refresh, one in-flight promise; 30-second network timeout, 45-second tab-session persisted cooldown, minimum 60 seconds after failure, Retry-After seconds/date support. No retries, polling, navigation/remount requests, custom auth headers or client API secrets. Local interval only updates the elapsed clock/button. Session controls are not global quota enforcement; Supabase limits/cache remain per isolate. Unavailable or invalid receipts clear live values and never substitute fixtures.

Scenario Lab keeps the original generated JavaScript unchanged, frozen synthetic inputs and `connect-src 'none'`. Only navigation and explicit labeling change. Browser hash verification does not claim engine reproduction; the existing offline verifier performs it.

## Predeployment checks

- Full TypeScript test suite: 171 passed, zero failed.
- TypeScript and ESLint: passed.
- Isolated static frontend build: passed, two allowed browser source modules, no source maps.
- Local mobile Scenario Lab: all 12 rendered, expected WAIT/MONITOR/PROCEED_TO_REVIEW, no page overflow at 390 px.
- Static scenario/output suite: 19 passed, zero failed (190 tests total with the full suite).

## Observed deployments

| Environment | Public URL / immutable deployment | Result |
| --- | --- | --- |
| Staging | https://live-staging.afterclose-preview.pages.dev / `d6803c29-3638-4141-bf8a-c8e45041b25d` | Verified before promotion; production was still synthetic during this gate. |
| Production | https://afterclose-preview.pages.dev / `d5099b58-7acd-4a6c-a660-109bc6941bb0` | Same artifact; Cloudflare uploaded zero new assets on promotion (11 reused). |
| Rollback | https://0bd20e4d.afterclose-preview.pages.dev / `0bd20e4d-c861-4ee0-898f-ea43c579fc44` | Preserved synthetic-only deployment/source `538b119`. |

Eight served HTML/JS/CSS files matched SHA-256 against the local manifest on both aliases. Cloudflare consumed the root `_headers`; delivered CSP was checked independently. Gateway build `dirty:false`, source digest `57b9d8f2cf1d63e919aa479f165ccf93eceea0944607f625857434f2411f5a0e`. Both exact CORS origins passed; an unrelated preview origin returned 403 with no allow-origin header. Public GitHub API returned 200 and `private:false` without authentication.

## Live evidence and receipt results

These captures are historical release evidence, never frontend fallback data.

| Observation | Staging | Production |
| --- | --- | --- |
| Provider token time (UTC) | 2026-10-09 12:23:26.631 | 2026-10-09 12:34:56.322 |
| AfterClose observation (UTC) | 2026-10-09 12:23:33.051 | 2026-10-09 12:35:01.896 |
| Evaluation (UTC) | 2026-10-09 12:23:33.070 | 2026-10-09 12:35:01.903 |
| Provider / observation ages at evaluation | 6,439 / 19 ms | 5,581 / 7 ms |
| Evidence / decision | PARTIAL / WAIT | PARTIAL / WAIT |
| SHA-256 | `78b1bb6ae5080c3e768fae1635a9502825c55afe6dd5aa0df2af88b36683e6c3` | `683861e0d9d33248f8bfc36cb7f309f51a3cb4771260c58ce6cde74c347d8351` |

All six provider audits in each receipt returned HTTP 200/code 0; discovered Ondo NVDAon identity matched BSC 56. Browser clocks matched receipt arithmetic (the UI rounds seconds to one decimal). Browser SHA-256 passed; the existing repository verifier independently reproduced both canonical engine results. See [staging receipt](public-live-staging-receipt.json), [production receipt](public-live-production-receipt.json) and [structured validation evidence](public-live-evidence.json).

Agent initiated exactly one staging and one production capture (12 Binance calls). Filtered runtime logs show two additional staging-period evaluations at 12:29:17 and 12:31:36 UTC during the owner's clipboard-check window; each used six calls. Four successful MISS evaluations total **24 Binance calls** during this release. Owner confirmation of the two manual refreshes is pending; they are not silently attributed to automated testing. Health, static asset and denied-origin checks made no provider calls. No agent navigation/remount/retry capture occurred. Per-isolate cache misses are expected; no cross-worker cache hit is claimed.

## Browser, error and security verification

- Staging: all 12 scenarios at 320, 390 and 1440 pixels, 36 expected verdicts and no page overflow. Production: all 12 at 320 pixels; live view also checked at 320/390/1440. No console errors/warnings on the checked production path. Legacy root hash scenario links redirect to the lab correctly.
- Refresh disabled while loading; no automatic initial/navigation/remount requests. Local 503 UI displayed the exact unavailable message, cleared evidence and retained cooldown through reload. Unit tests cover coalescing, seconds/date Retry-After, invalid schema/digest and no retries. These controlled failures used the identical UI source with a local fixture URL; production/provider outages were not deliberately induced.
- The embedded test browser reported copy success but returned stale clipboard contents, including for Supabase's own Copy action. **Before promotion the owner confirmed in her regular browser that Copy SHA-256 pasted the matching digest.** Browser digest re-verification passed on both hosted origins. The optional download event could not be confirmed by the embedded browser; no successful automated download is claimed. Receipt JSON is also inspectable and both captured envelopes are committed for offline verification.
- Frontend scan: 12 artifact files, zero provider secret names, authentication header material, Binance host, localhost addresses or source maps; no Worker/Functions entry. Exact-value credential scans included binary assets and the gateway bundle, with zero findings. Server source necessarily contains credential variable names; no values enter public assets.
- Canonical engine and receipt implementation are unchanged from the verified base. Netlify unchanged. The old synthetic rollback artifact remains intact.

Screenshots: [desktop](public-live-desktop.png), [mobile](public-live-mobile.png). Screenshots show the recorded evaluation, not a current quote.

## Cost boundary

Existing free Cloudflare Pages project and Supabase Free project only. No payment method, paid service, overage setting, wallet, simulation, transaction signature or broadcast was introduced. Cloudflare showed the same single Pages project, no Git integration, zero environment variables and zero Workers requests/CPU/build minutes. Supabase showed Free, no overage billing, no quota exceeded, 33/500,000 displayed invocations, rounded 0.00/5 GB egress and zero overage. Supabase warns counters can lag one hour; 33 is not the final invocation total. No new billing setting was enabled, and this is not a complete invoice-ledger audit.

## Submission work remaining

The README, factual Developer Experience evidence outline, approximately 3:40 video script and submission checklist are prepared. The owner must write the firsthand report, record/add a video if desired, and clarify the official main-track dry-run/small-live-amount requirement for this read-only project. No form was submitted and no recording is claimed complete. These are submission preparation items, not blockers to the verified read-only public demo.
