# Secure live readiness rehearsal

2026-10-06. Local production rehearsal only; no Render service or Cloudflare change.

## Reproducible checks

Use Node 24.21.0 from the repository root. The Windows rehearsal invoked the bundled executable directly. These are historical checks with optional local browser tooling and ignored evidence directories; they are not a fresh-clone recipe. Use [current reproduction](../../reproduction.md) for the credential-free 190-test baseline and builds. The browser harness requires the Playwright installation referenced in its source and local Microsoft Edge. Exact-value scanning requires existing owner credentials; it intentionally fails without them. Build the static lab before its output tests on a fresh clone.

```text
npm ci --include=dev --ignore-scripts --no-audit --no-fund
node --conditions=react-server --import tsx --test --test-concurrency=1 tests/*.test.ts
node --import tsx --test static-preview/model.test.ts
node --test static-preview/output.test.mjs
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node scripts/build-live-safe.mjs
node --import tsx scripts/check-readiness-browser.mjs
node scripts/scan-known-credentials.mjs --counts-only .next .tools/readiness .tools/competition-snapshots
node scripts/scan-credentials.mjs --counts-only .next .tools/readiness .tools/competition-snapshots
node scripts/scan-client-boundary.mjs .next/static .tools/readiness/browser-artifacts
```

The install was rehearsed in a new isolated directory from the exact package and lock files: 641 packages, exit 0. Existing source dependencies use that same lockfile. No install lifecycle scripts ran. Deprecation notices were emitted; this is not a claim of a complete dependency vulnerability audit.

Tests: 133 canonical/competition/readiness tests + 15 static model + 4 static output = **152 passing, zero failing/skipped**. This includes 26 new readiness tests. Lint and TypeScript pass without errors.

The isolated Next production build passed. It copied zero environment files and attempted **zero provider fetches**. All application routes remain dynamic. Both persistent Turbopack cache flags are disabled. The private staging output and final .next output are included in exact-value scanning, including binary files.

Build source fingerprint: `715e52738c45c7e8ef0cd09da65cf88e4a2022a6a78b62fe0e1873438ed101c9`.
The local build records base commit `e05a16b1dde15d8f81299ff472ed5a45e62cb5ff` plus an explicit working-tree marker because validation preceded the final commit. It does not claim that base alone contains the changes. The fingerprint identifies tested application sources/configuration; a later clean hosted build must identify the reviewed final commit.
Engine: `reference-truth/v1:0b8daa72d38484ed6c6e4ea5e89213029c3c47f97bfcccdca6a7aa67e6cc669b`. Engine and 12 scenario fixtures are unchanged.

## Browser coverage

See [results.json](results.json) and the screenshots in this directory. The runner starts the production Node server, explicitly sets deployment mode, and shuts down its own processes. Browser traffic is restricted to the local application origin. HTML, RSC, JavaScript and response bodies are retained in ignored local artifacts for in-memory security scanning; no request authentication is recorded.

Coverage: genuine six-endpoint capture; WAIT/PARTIAL semantics; original provider/observation clocks; receipt SHA-256 and clipboard; 1440/390/320px layouts and first-viewport verdict; provenance/receipt overflow; all 12 synthetic scenarios; stale status after an idle interval; malicious live query blocked; GET health, POST 405 and query 400; absent/malformed credentials; missing/invalid/conflicting deployment mode; separately accessible Scenario Lab; explicitly synthetic mode; delayed loading followed by safe failure; historical snapshot separation.

The first browser attempt received four sanitized HTTP 401 responses and exceeded its navigation wait. A subsequent direct read-only capture succeeded on all six endpoints. Later browser captures also succeeded. The cause of the initial 401s was not established; they were not represented as successful or live evidence.
Two QA harness issues were corrected: an unbounded diagnostic response-body wait during streaming navigation, and an ambiguous selector matching two legitimate synthetic banners. Application fixtures were not substituted to obtain a passing live capture.

Screenshots were visually inspected for the mobile live layouts and the loading state. No invented percentage, price or verdict appears while loading. A Render platform wake page cannot be tested locally or replaced by application UI before Node starts.

## Security and limitations

Exact-value scans compare configured credentials in memory as UTF-8, UTF-16, URL encoding and base64. Pattern scans and client secret-name/auth-header scans report counts only. The checked surfaces include repository files, public/generated assets, HTML/RSC/JS, maps, build caches, logs/errors, receipts, snapshots and test artifacts. Private .env inputs are excluded from output scanning. See the final counts in validation-summary.json.

Readiness remains CONDITIONAL GO: owner must accept free-tier sleep/suspension and snapshot loss; confirm a no-payment account flow; and, after separate authorization, prove Linux resource fit and Binance connectivity from the actual Render region. No Linux/Render runtime, billing controls or hosted cold start was tested here. The public Git repository visibility was confirmed anonymously. Main, the static branch and the Cloudflare fallback remain unchanged.

The Windows restricted-token test attempt failed during tsx initialization (uv_os_get_passwd ENOMEM), before application tests ran. The complete rerun with normal local account permissions passed. Final browser QA completed end to end with all eight modes, zero browser errors and zero external browser requests. Across this milestone's intentional integration/rehearsal attempts: 28 authenticated Binance GETs and five anonymous Ondo page requests; no transaction endpoints.

