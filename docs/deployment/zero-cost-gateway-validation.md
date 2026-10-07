# Prompt 21 validation record

Date: 2026-10-07. Branch `codex/zero-cost-live-gateway`, based on `ff7f2680d934543b3beab241e8a8e951e49f0199`. The final commit is the commit containing this record; use `git rev-parse HEAD`. Build identity embeds the actual checkout commit and dirty state, plus a source fingerprint. No artifact is represented as deployed.

## Checks

| Check | Result |
| --- | --- |
| Canonical/application tests | 133 passed, unchanged engine-source hash asserted |
| New gateway tests | 14 passed: canonical equivalence; exact CORS; path/query/method/header rejection; missing/conflicting mode and credentials; cache clocks; concurrent coalescing and throttling; failure cooldown; reflection/size rejection; metadata TTLs; four adapter failure cases; bundle dependency boundary |
| New frontend/package tests | 3 passed: separate-origin CSP/client boundary; exact offline Scenario Lab bundle parity; literal Netlify entry configuration/public boundary |
| Existing static model tests | 15 passed, including all 12 scenarios |
| Existing static output tests | 4 passed |
| **Total** | **169 passed; 0 failed; 0 skipped** |
| Lint / TypeScript | PASS, zero diagnostics |
| Gateway production build | PASS, 122 inputs including entry; native Node imports only crypto/async_hooks; roughly 491 KB uncompressed including entry and library; no source maps generated |
| Existing static frontend build | PASS, browser-only graph; original static source unchanged |
| Integration prototype build | PASS, Live bundle has one input and no server dependencies; Scenario Lab bundle copied byte-for-byte |
| Genuine benchmark | 5/5 successful LIVE/PARTIAL/WAIT; 5/5 canonical digest equivalence; five cache checks preserve observations with zero calls |
| Browser package smoke check | Genuine live evidence received through prebuilt function entry; browser SHA-256 verification passed |
| Exact owner credential scan | ZERO matches across 231 files: tracked/unignored source plus function/public/frontend bundles, build manifest, responses/receipts, logs, screenshots and static artifacts; binary and encoded forms included |
| Client boundary scan | ZERO secret-name or authentication-header findings across 10 frontend/public files |
| Credential-pattern scan | ZERO final findings across 187 text files (38 binary skipped by this heuristic, included in the exact scan). Initial broad scan flagged only the deliberately fake long test credentials; shortened those fixture markers, without changing test behavior or weakening the scanner. No owner secret was found. |

All build/test artifacts and raw sanitized rehearsal responses remain local under ignored `.tools/`. No `.env` input is copied. Source maps are disabled for both candidate bundles; none are included in the package. Existing unrelated ignored historical artifacts are not represented as rescanned here. Exact scans read owner values in memory and report counts, never values.

## Browser judge cycle

Tested using the local browser against two loopback origins: frontend 4173, built gateway 4174. Genuine API traffic used the existing TLS trust store; certificate verification was never disabled.

1. Opened Live view and clicked Fetch live evidence. Visible loading text: “Fetching current Binance Web3 evidence…”.
2. Received a genuine current token observation. UI showed PARTIAL, WAIT, absent independent reference, unverified multiplier, unknown authoritative session, NOT_RUN execution and individual blocking reasons.
3. Expanded receipt; the browser verified its canonical SHA-256 digest. Engine ID and build identity visible.
4. Refreshed inside the cache interval. Provider time stayed `2026-10-07T12:54:56.315Z`; observation stayed `2026-10-07T12:54:59.543Z`; evaluation advanced from `12:54:59.561Z` to `12:55:17.170Z`; observation age became 17.6 s. Refresh did not relabel old observations as new.
5. Followed Scenario Lab link. Fictional complete-evidence case showed PROCEED_TO_REVIEW with synthetic labels and execution disabled. All twelve cases remained available.
6. Restarted only the local adapter with `--unavailable`, leaving `.env.local` untouched. Live showed LIVE_EVIDENCE_UNAVAILABLE and no price. Offline Scenario Lab still opened and returned the complete-case result.
7. Restarted the genuine adapter after the final entry packaging change; the built native function again returned verified live evidence.

| View | 1440 px | 390 px | 320 px |
| --- | --- | --- | --- |
| Live evidence + expanded receipt | PASS | PASS | PASS |
| Scenario Lab complete case | PASS | PASS | PASS |
| Unavailable + offline link | PASS | PASS | PASS |

No page-level horizontal overflow at any requested width. Narrow Scenario Lab evidence tables retain their deliberate internal scrolling. Nine local full-page screenshots cover the three views × three widths. Expected HTTP 503 during failure is intentional; no unexpected application console errors were seen during the successful cycle. Viewport override was reset after QA.

## Reproduction

Use Node 24 with existing dependencies. Run builds before output tests:

```text
node scripts/build-gateway.mjs
node scripts/build-static-preview.mjs
node scripts/build-gateway-preview.mjs
node --conditions=react-server --import tsx --test --test-concurrency=1 tests/*.test.ts
node --test tests/gateway-preview.test.mjs
node --import tsx --test static-preview/model.test.ts
node --test static-preview/output.test.mjs
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node --conditions=react-server --import tsx scripts/benchmark-gateway.ts
node scripts/scan-known-credentials.mjs --counts-only .tools/gateway-package .tools/gateway-preview .tools/gateway-rehearsal .tools/gateway-build.json static-preview/dist
node scripts/scan-client-boundary.mjs .tools/gateway-preview .tools/gateway-package/public
node scripts/scan-credentials.mjs --counts-only .tools/gateway-package .tools/gateway-preview .tools/gateway-rehearsal
```

Benchmark is an explicit read-only live operation, not a deterministic regression test. It loads local credentials privately and waits 31 seconds between captures. On this Windows host, Node used `NODE_USE_SYSTEM_CA=1` for the existing trusted CA. Normal Next builds were not run: this milestone extracts a function and preserves the prior framework-build safeguard.

## Scope boundary

No Netlify account/project, draft or production deployment; no Cloudflare or Render changes; no purchase or payment method; no new provider, multiplier change, database, wallet connection/signature, transaction simulation or broadcast. Deterministic fictional Scenario Lab evaluation and unit-test doubles are not wallet/transaction simulation. Main and prior deployment branches remain at their original commits. Only the new branch is pushed; no merge.

Decision: **CONDITIONAL GO**, with the explicit later host/account checks in [feasibility](netlify-free-feasibility.md). The genuine evidence limitations are displayed product behavior, not reasons to alter WAIT.
