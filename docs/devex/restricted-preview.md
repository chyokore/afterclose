# Restricted synthetic preview milestone

October 5, 2026. Starting commit: `4f33b77717aa72db8281beeeb0c60a0a61639f8b`.

## Work performed

Codex audited all app routes/layouts, the two fetch sites, Binance endpoint wrappers, issuer/equity/calendar adapters, client refresh and snapshot components, metadata, CLI diagnostics, captures and failure paths. The live dashboard previously fetched Binance and Ondo and included historical issuer/discovery values. The restricted preview now selects a separate fictional dashboard before loading that code. Direct live-loader and transport calls reject synthetic or invalid modes before provider catch/fallback handling. The original local live path is retained when the server flag is unset outside Vercel.

The server flag is `AFTERCLOSE_PREVIEW_MODE=synthetic`. Root layout labeling persists across normal loading/error/not-found states. Metadata is synthetic and noindex; refresh repeats frozen fixture input. All twelve scenario fixtures remain fictional, with no wallet/execution UI. A source-controlled Vercel setting disables Git auto-deployment as an additional precaution; no Vercel project was created or connected.

Official Vercel pages were opened directly: current Authentication / All Deployments is included on every plan, despite outdated search snippets. The first deployment of a new project is always Production, so the plan explicitly requires saved all-URL protection before upload. Hobby eligibility and actual account configuration are unresolved. The proposed plan is owner-only initially; any reviewer grant must be approved by name.

## Checks and troubleshooting

- Node 24.21.0 was used from this repository's existing ignored tool directory; system Node is 16 and unsuitable for this project.
- Initial test execution failed in sandbox startup with `uv_os_get_passwd ENOMEM`, before test assertions. Retried outside sandbox with test concurrency 1: **86 tests passed**, zero failed/skipped. Existing live-path tests use intercepted responses; no live API diagnostic was run.
- Added three regression tests covering mode validation, all network-capable adapter entry points with and without test secrets, and refresh/label boundaries. The fetch spy recorded zero calls for synthetic and invalid modes.
- Lint initially rejected CommonJS in the rehearsal preload. Added a narrowly scoped documented exemption for the Node preload; subsequent full ESLint run passed.
- Rehearsal first failed because Windows backslashes in `NODE_OPTIONS` were consumed. Changed the preload path to forward slashes. Next attempt failed because Turbopack rejects a dependency junction outside its root. Replaced the junction with an isolated directory of file hardlinks to existing installed dependencies; no dependency upgrade or installation was required.
- The reproducible `node scripts/rehearse-synthetic.mjs` exports app files into a fresh ignored directory, allowlists process environment, omits every env file/provider secret, disables telemetry, and intercepts server fetch during build and runtime. Its HTTP driver remains outside the preload and uses loopback only.

Production rehearsal and credential-scan outcomes are recorded below. No browser visual or hosted authentication result is implied by an HTTP check.

## Approval boundary

**NO HOSTED DEPLOYMENT HAS OCCURRED.** No host project, repo connection, public URL, DNS change, provider-credential upload or hosting purchase was performed. Noctive was not accessed. The [reviewable approval plan](../deployment/restricted-preview-plan.md) distinguishes local evidence from hosted checks that await explicit user approval.

Credential review: scanned 74 tracked/new non-ignored text files for private-key blocks, GitHub token patterns and nonempty long Binance credential assignments. No findings after fixing a scanner regex that incorrectly crossed blank `.env.example` lines. This is a bounded pattern scan, not a guarantee against every secret format. No local credential file values were printed. `git diff --check` passed.

Git auto-deploy precaution: the committed `vercel.json` uses `git.deploymentEnabled: false`, as documented in [Vercel Git configuration](https://vercel.com/docs/project-configuration/git-configuration). This does not create or link a project, establish authentication, or authorize manual deployment.

An additional rehearsal attempt compiled and passed TypeScript but failed Next's generated `/_global-error` prerender with `Expected workStore to be initialized`. The harness was invoking the original checkout's Next CLI against a separate copied dependency tree. It was corrected to launch the isolated tree's own CLI; the final outcome is recorded below.

Full-checkout TypeScript validation (including tests, beyond the upload export) initially found that new mocked `ProcessEnv` objects omitted Next's required `NODE_ENV` type. Added `NODE_ENV: "test"` to those test objects; `tsc --noEmit` then passed. Application runtime code was unchanged by this correction.

## Final local results

- **86/86 tests passed**, no skips/failures, after the test typing correction.
- Full ESLint passed; subsequent edits to the rehearsal harness and test file each passed targeted ESLint. Full-checkout `tsc --noEmit` passed.
- **Production build passed** with Next.js 16.3.6 / Turbopack and Node 24.21.0. `/`, `/demo` and `/_not-found` are dynamic routes. Launching the isolated tree's own CLI resolved the prerender invariant.
- Local production server on loopback passed dashboard, lab, all 12 scenarios, invalid-scenario fallback and 404 checks. Three RSC refresh requests stayed synthetic. Eleven JS/CSS assets loaded and passed historical-value/credential-name checks.
- Restarting the same build with an invalid mode returned server errors for `/` and `/demo` without displaying market observations.
- **Zero server fetch attempts** were recorded across the build and both runtime modes. No provider secrets or env files were supplied. The audit covers the application's existing fetch transports; this is not an OS egress firewall or hosted-network proof.
- HTML/RSC checks rejected the known historical discovery marker, captured ratio and NVDAon text. Synthetic UI exposes no wallet or transaction controls. Source assertions cover loading/error copy; no new visual screenshot or interactive browser-click validation is claimed.
- Rehearsal completed successfully and stopped both local servers. Artifacts remain ignored under `.tools/synthetic-rehearsal-1791197630678`.
- Hosted protection, billing eligibility, generated aliases, reviewer identity/revocation and hosted egress checks remain unperformed, awaiting approval.
