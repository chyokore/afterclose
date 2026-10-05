# Cloudflare small-migration rehearsal

**DEPLOYMENT STATUS: NOT DEPLOYED**

Date: October 5, 2026. Branch: `codex/cloudflare-synthetic-rehearsal`. Exact base: `69fd830b15e58ccd792b8d7d5f717ce20ca3835b`. The feasibility branch, restricted Vercel branch and main remain unchanged. This document is evidence and a future runbook, not permission to host.

## Minimum migration

| Package | Previous | Candidate | Reason |
| --- | --- | --- | --- |
| next | 16.3.6 | 16.3.8 | Supported adapter peer floor and security patch |
| @next/env | ^16.3.6 | 16.3.8 | Keep Next environment loader aligned and pinned |
| eslint-config-next | 16.3.6 | 16.3.8 | Match framework patch |
| @opennextjs/cloudflare | absent in root; 1.20.7 in old experiment | 1.20.8 | Supported existing-Next adapter |
| wrangler | absent in root | 4.147.0 | Pinned Workers/workerd tooling |

Node remains 24.21.0; React/React DOM remain 19.2.8. Lockfile changes include dependencies required by those packages, with no unrelated direct upgrades. The [Next release](https://github.com/vercel/next.js/releases/tag/v16.3.8) contains security fixes. The existing application architecture, UI, fixture labels and Reference Truth Engine source are unchanged.

`open-next.config.ts` selects the adapter defaults. `wrangler.json` points to `cloudflare/worker.mjs`, uses compatibility date 2026-10-05 and explicit `nodejs_compat`, and binds `.open-next/assets` as ASSETS. `workers_dev` and `preview_urls` are false; no routes, custom domains or remote storage bindings are configured. `assets.run_worker_first=true` ensures the guard also covers assets. This costs Worker invocations on asset requests and must be included in the Free request budget.

`cloudflare/guard.mjs` permits only an exact trusted `env.AFTERCLOSE_PREVIEW_MODE === 'synthetic'`. Missing, malformed and all other values return a non-cacheable 503 before the Next fetch handler runs. No query, cookie, header, path or body selects mode. Browser localStorage and JavaScript have no access to Worker bindings; they can only generate the already-untrusted HTTP requests. Static import initializes the adapter module, but blocked requests never invoke application rendering or providers.

The ordinary `npm run dev` workflow is unchanged: with the preview flag unset and no Vercel hosting marker, authorized local development can use its existing live path. `AFTERCLOSE_PREVIEW_MODE=synthetic` opts local Next into synthetic mode. Cloudflare always enters through the separate Worker guard. It cannot use the local default. Build and runtime both use the safe synthetic value. A future Access policy supplies owner authentication; this configuration guard does not authenticate users.

## Reproduce locally without credentials

Use Node 24.x. Install from the lockfile with `npm ci --ignore-scripts --no-audit --no-fund`. Do not run a deployment command. Native optional binaries are supplied by the pinned platform packages; no blanket lifecycle-script approval is required by this rehearsal.

```powershell
node --conditions=react-server --import tsx --test --test-concurrency=1 tests/*.test.ts
node node_modules/eslint/bin/eslint.js .
node node_modules/typescript/bin/tsc --noEmit
node scripts/rehearse-synthetic.mjs
node scripts/build-cloudflare-local.mjs
node scripts/check-cloudflare-local.mjs
node scripts/check-cloudflare-local.mjs missing
node scripts/check-cloudflare-local.mjs live
node scripts/check-cloudflare-local.mjs 'synthetic '
```

The build helper creates `.tools/cloudflare-migration`, copies only explicit source/configuration files, and hardlinks dependency files into an independent dependency tree so Turbopack accepts the project root. It never copies `.env.local` or other dotenv files. Child environments allowlist only OS essentials and safe rehearsal settings. They do not inherit Binance/equity/wallet/signing/transaction credentials or Cloudflare authentication. Wrangler uses an isolated configuration directory and dotenv loading is disabled. The helpers bind only loopback and terminate their child on completion. Do not edit hardlinked dependencies in the stage.

The normal Next helper builds separately and denies/audits application fetches. The Cloudflare build runs `opennextjs-cloudflare build` with the same preload. The runtime helper invokes only `wrangler dev --local`, using a test-only entry wrapper around the exact candidate entry. It denies/counts global application fetches and records a per-response counter. The wrapper never selects mode or changes the guard. Local asset binding requests are not external provider requests. Wrangler's own metadata traffic is separate from app instrumentation.

## Results

All required local functional validation completed successfully. **NOT READY FOR DEPLOYMENT** because Workers Free CPU suitability remains a material unresolved risk.

| Check | Result |
| --- | --- |
| Complete application suite | 88 passed, 0 failed, 0 skipped; original 86 plus 2 guard tests |
| Lint / TypeScript | Passed; no remaining lint warnings |
| Independent normal Next production build | Passed, Next 16.3.8 |
| Normal Next isolation rehearsal | Dashboard, demo, 12 scenarios, fallback/404, 14 adversarial HTML/RSC cases, 3 direct-route probes, 3 RSC refreshes, metadata, 11 assets, 2 invalid-mode server failures; zero app fetches |
| OpenNext build | Passed: Cloudflare 1.20.8 / AWS 4.1.7 |
| Workerd main route matrix | 52/52 HTML/RSC cases passed, including all 12 scenarios and 8 HTML/RSC 404 cases |
| Workerd extra requests | 6/6 mobile-user-agent HTML/RSC refreshes; 2/2 POST body override attempts; 3/3 profiler requests |
| Metadata / assets | Synthetic title, noindex/nofollow and viewport checks; 11/11 JS/CSS assets |
| Missing/invalid server binding | 24/24 HTTP 503 checks: missing, live, trailing-space synthetic; four routes including asset paths, GET and POST |
| Rendered loading/error components | 2/2 pass; no substitute market data or historical captured ratio |
| Application external/provider fetch attempts | **0** across both builds, normal Next and workerd checks |

The successful profiled workerd run comprises 75 top-level requests: 52 route cases + 6 refreshes + 2 POST attacks + 3 profile requests + 1 metadata page + 11 assets. Invalid-binding runs add 24, for 99 assertions on responses across the final matrix. RSC canonicalization may add HTTP redirects underneath those requests. The earlier non-profiled workerd pass is separate and not double-counted. Unit guard coverage also rejects null, empty, case-altered, whitespace, NUL, boolean and array values without any delegate invocation.

Loading/error components were rendered and checked outside workerd, and their existing layout/source assertions passed. Runtime configuration-error 503s and unknown-route 404s were tested in workerd. We did not inject a production React render exception or simulate a timed loading animation. Mobile checks use a mobile user agent plus viewport metadata; no claim of screenshot or touch-interaction validation is made. localStorage/client JavaScript cannot set the trusted binding; request-based avenues were tested, while a browser storage manipulation was not separately performed.

## Bundle, startup and runtime observations

The adapter output contains 1,143 files / 22,548,427 bytes, including 15 static assets totaling 725,615 bytes; largest asset 229,156 bytes. The captured local Wrangler instrumented bundle is 5,726,248 bytes, with a 7,592,255-byte source map. No maps were emitted in the adapter output itself. Local development bundling includes instrumentation and is not a measured final remote upload artifact.

On the successful profiled run, first dashboard response wall time was 2,082 ms. Subsequent HTML cases: 169–260 ms, median 197 ms; RSC cases including redirects: 32–165 ms, median 71 ms. Static asset request logs: 18–38 ms. These include local emulation, transport and instrumentation overhead; first response time is not Worker global-scope startup time. An earlier run overlapping the independent build had much higher/retried wall times and is not used as the representative timing result.

The loopback inspector profile sampled 242.928 ms of active time across three representative requests during a 1,578.704 ms capture. Idle/program samples were excluded; framework, facade and GC overhead remain. It is **not** hosted billing CPU or a per-request limit measurement. Samples include framework request-context and invocation code; a function named fetch in that profile is not evidence of provider egress (the application egress counter remained zero). The initial Node WebSocket connection failed; an explicit loopback Origin using the already locked transitive ws package connected successfully.

**Remaining hosted-limit risk: HIGH.** The [current official Free limits](https://developers.cloudflare.com/workers/platform/limits/) are 10 ms request CPU, 128 MB memory, 1 second global-scope startup, 64 MiB uncompressed code, 100,000 requests/day, 20,000 assets and 25 MiB per asset. Local size/asset observations are comfortably below their corresponding size ceilings, but sampled active time gives insufficient confidence in the CPU budget. Local profiling cannot prove or disprove hosted compliance. No hosted startup_time_ms, memory accounting or CPU telemetry exists. Worker-first asset handling also consumes invocations. No paid-plan upgrade or architectural optimization was performed.

Before deployment approval: establish a defensible Free CPU/startup strategy, resolve the Windows-specific confidence gap (a Linux/WSL repetition is advisable), recheck current limits and owner acceptance of onboarding/payment details, and finalize the hosted egress audit mechanism. Access inheritance, all-alias protection, owner OTP, hosted CPU/memory/startup, logs and credential review remain hosted-only gates. The [official OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) supports the adapter path; successful Windows rehearsal does not remove its platform warning.

The build fetch-audit file is empty. Wrangler made tooling-level Request.cf metadata attempts and emitted timeout/certificate warnings before using placeholders; TLS checks were not disabled. These were not application/provider requests, account authentication or resource creation.

## Future hosted sequence — prepared, not executed

Every remote step below requires a separate explicit owner approval. Use a clean, sanitized export of the approved commit and reviewed generated artifact, never the developer checkout with local environment files. Do not connect Git auto-deployment. Do not upload the rehearsal wrapper or its fake local configuration.

1. Owner reviews current Workers Free and Zero Trust Free eligibility, the displayed $0 plans and the payment-details onboarding requirement. Owner supplies payment details only directly to Cloudflare if separately approved. Select a dedicated account to avoid affecting other projects. Confirm exact owner email and eligible seat allowance.
2. Enable Zero Trust Free and email OTP. Before creating any Worker, save owner-only Access for all Workers, production **and** previews. The documented path is Workers & Pages → Protect all Workers → All traffic. Use an exact-email Allow policy in Zero Trust; the domain-wide quick option is unsuitable. Inspect saved rules and all more-specific overrides for bypasses. The [official Access guide](https://developers.cloudflare.com/workers/configuration/cloudflare-access/) documents inheritance for new Workers and protection of assets.
3. Account-wide protection can precede first upload; Worker-specific policy needs an existing Worker ID. If the account default is unavailable, stop before uploading AfterClose. A separately approved content-free always-deny placeholder with routes disabled is the fallback for establishing a Worker ID. Attach and verify exact-owner Access before replacing it. There must be no temporary public AfterClose deployment.
4. In the sanitized approved export, build with the safe synthetic environment and the pinned local adapter. Review `wrangler.json`: candidate guarded entry, only safe synthetic binding, no credentials/storage/routes, production and preview URL flags false. Repeat credential and output review. Resolve local findings and confirm the artifact matches the approved commit.
5. **Future remote commands, not run in this rehearsal:**

   ```powershell
   node node_modules/wrangler/bin/wrangler.js login
   node node_modules/wrangler/bin/wrangler.js deploy --config wrangler.json
   ```

   Run from the sanitized candidate directory only after steps 1–4 and separate deployment approval. Confirm the dedicated account during login. The upload must retain both URL flags false. The adapter build and Wrangler upload are separate to preserve the custom guarded entry; do not use a migration wizard. No resource-provisioning prompts are acceptable. Inspect the saved Worker and inherited Access immediately after creation. Account-default protection is documented, but its actual behavior and upload/startup acceptance remain unverified until this authorized phase.
6. In the dashboard, verify Access covers all production/preview/asset traffic and only the exact owner email. Enable only the protected production workers.dev URL; keep preview URLs disabled. Record every alias privately. Update the reviewed configuration to match before any later upload so it cannot inadvertently change routing. No DNS/custom domain/tunnel is required.
7. Before owner login, test an incognito session and unauthenticated GET/HEAD/OPTIONS to `/`, `/demo`, scenario URLs, RSC requests, JS/CSS assets and unknown routes across every enabled alias. Require Access, never application content. Test an unapproved identity is denied. If any path bypasses protection, disable routes immediately and keep Access enabled.
8. Owner authenticates through OTP. Check dashboard synthetic banner, all 12 scenarios, RSC navigation, hard refresh, mobile rendering, metadata, loading, error and 404 behavior. Exercise mode override inputs again. Preserve WAIT/PROCEED_TO_REVIEW semantics and fictional labels.
9. Inspect hosted logs/CPU/startup/errors and bounded outbound instrumentation or equivalent provider egress telemetry. Require zero live-provider requests; ordinary absence of error messages is insufficient. This local test wrapper is not a hosted audit implementation. Agree and validate the hosted audit mechanism before upload. Review deployed binding names, source maps, static bundles and sanitized logs for credentials and misleading captured market observations.
10. Keep owner-only Access and extra routes disabled. Stop on Free CPU/startup failures; do not purchase a plan or redesign without authorization. **STOP before adding judges or sharing access-bearing links.** A separate approval must list judge identities and duration.

## Rollback

No hosted resource exists to roll back. Locally, retain this branch and switch to `codex/zero-cost-hosting-feasibility` at the recorded base (or the preserved synthetic Vercel branch) after saving any work, then reinstall its lockfile. Do not merge or reset main. If a future hosted verification fails, disable production and preview routes while keeping Access enabled; revert only to a reviewed synthetic guarded version, never an unguarded live-capable build. Remove resources only under the future owner's authorization.

Every lockfile package-path version addition, removal and change is listed in [cloudflare-dependency-changes.json](cloudflare-dependency-changes.json). This includes optional platform variants; 357 changed paths do not represent 357 unrelated direct upgrades.

### Credential scan scope

The final scan covers Git-visible source/configuration/scripts/docs, the complete generated `.open-next` tree (including assets), captured local Worker bundles and their maps, sanitized staged source/Worker configuration, CPU/timing records and build/runtime/test logs. It checks private-key blocks, GitHub tokens, long credential assignments and selected secret-key prefixes without printing matching values. This is a bounded pattern scan, not a proof that arbitrary unknown credentials can never exist. No provider or wallet credentials were available to the build/runtime child processes, and no `.env.local` was copied. Exact final counts are recorded below.

For a fresh repeat, preserve or move aside the generated `.tools/cloudflare-migration` directory first; the helper's fixed staging path is intended for one source snapshot. Never reuse old dependencies/output after changing the lockfile. Run the two rendered component checks with `node --import tsx scripts/check-ui-states.ts`. The runtime inspector helper uses the ws version already locked transitively with Wrangler; it installs nothing.

Final credential-pattern scan: **1,290 text files scanned, 0 findings; 5 binary files skipped**. Scope includes generated code/assets, all captured local Worker source maps, staged source/configuration and rehearsal logs. Loopback ports 3187, 3188 and 9239 had no listeners after completion. No staged `.env.local` exists. No Cloudflare account/project/deployment/Access policy/payment/DNS/tunnel or other hosted resource was created; no source was uploaded to a hosting provider. No wallet was connected and no transaction broadcast. Noctive was untouched.

### Exact changed-file manifest (19 files)

- `package.json`, `package-lock.json`: supported pinned dependencies and local build script.
- `open-next.config.ts`, `wrangler.json`: adapter/Worker target and safe runtime configuration.
- `cloudflare/guard.mjs`, `cloudflare/worker.mjs`: fail-closed candidate entry.
- `cloudflare/rehearsal-worker.mjs`: local-only outbound instrumentation wrapper.
- `tests/cloudflare-guard.test.ts`: binding/delegation security tests.
- `scripts/build-cloudflare-local.mjs`: credential-free staging and adapter build.
- `scripts/check-cloudflare-local.mjs`: workerd routes, isolation, invalid real-asset checks and inspector profiling.
- `scripts/check-ui-states.ts`: rendered loading/error checks.
- `scripts/rehearse-synthetic.mjs`: directory-link handling for the normal Next rehearsal.
- `scripts/scan-credentials.mjs`: explicit generated-output/log scanning and binary counts.
- `.gitignore`, `eslint.config.mjs`, `tsconfig.json`: exclude generated adapter/runtime artifacts.
- `docs/deployment/cloudflare-migration-rehearsal.md`, `docs/deployment/cloudflare-dependency-changes.json`, `docs/devex/zero-cost-hosting.md`: results, complete dependency-path delta and migration diary.
