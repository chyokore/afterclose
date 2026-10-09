# Reproduce AfterClose

Use Node **24.x**, npm and Git. Commands run from the AfterClose root and do not deploy. No credentials are needed for the baseline tests, historical receipt verification, static builds or offline Scenario Lab. Current public runtime: static Cloudflare Pages → Supabase Frankfurt → fixed read-only Binance Web3 requests.

## Obtain the reviewed candidate

Until a separately approved promotion updates `main`, use the review branch:

```sh
git clone --branch codex/release-promotion-audit https://github.com/chyokore/afterclose.git
cd afterclose
npm ci
```

The deployed application source is `8eba2c9`; release evidence is recorded at `89b30a6`. The review branch preserves that runtime and adds repository cleanup, documentation and local reproduction fixes. Read [promotion review](deployment/release-promotion-review.md) before any main-branch update. Cloudflare is Direct Upload and Supabase is manually bundled; these commands do not alter either service.

## Verify real historical evidence offline

```sh
node --conditions=react-server --import tsx scripts/verify-evidence-receipt.ts docs/deployment/public-live-production-receipt.json 683861e0d9d33248f8bfc36cb7f309f51a3cb4771260c58ce6cde74c347d8351
```

This is the genuine October 9, 2026 production observation. It must return `verified:true` and WAIT. It makes no network request and never loads `.env.local`. The receipt is historical proof, not a live fallback.

## Run baseline validation and static builds

```sh
npm run test:release
node node_modules/typescript/bin/tsc --noEmit
npm run lint
npm run build:public
node scripts/scan-credentials.mjs --counts-only .tools/public-live-release/dist
node scripts/scan-client-boundary.mjs .tools/public-live-release/dist
```

`test:release` builds the static lab first and runs the 171 application/gateway tests plus 19 scenario/output tests. `build:public` outputs `.tools/public-live-release/dist`; it does not deploy. That artifact is the real public frontend with the fixed gateway URL. Exact CORS intentionally denies localhost, so use the two offline options below for local browser inspection.

## Inspect the offline synthetic lab

```sh
npm run build:static
node scripts/serve-static-preview.mjs
```

Open `http://127.0.0.1:3190/`. All twelve cases are fictional, explicitly synthetic and fixed to September 26, 2026; no live provider calls occur. Stop the server with Ctrl+C.

## Replay the historical receipt through the local UI

```sh
npm run build:static
node scripts/build-public-live.mjs --fixture
node scripts/serve-public-live-fixture.mjs
```

Open `http://127.0.0.1:3192/`. Its prominent **HISTORICAL RECEIPT REPLAY · LOCAL QA · NOT CURRENT MARKET DATA** label distinguishes it from the live service. Refresh replays the committed production receipt, without contacting Supabase, Binance or Ondo. No ignored capture file is required. Never upload `.tools/public-live-fixture/dist`.

Optional failure QA: write `failure`, `rate-limit` or `bad-digest` into `.tools/public-live-fixture/mode.txt` before a permitted manual refresh. `success` restores replay. These modes change only local test responses; existing browser cooldowns remain enforced. Stop with Ctrl+C.

## Retained local Next.js application

For a secret-isolated production build, use `npm run build` (equivalent to `npm run build:live-safe`). It copies allowlisted source/configuration, excludes environment files, denies build-time network, and writes `.next` after success. The dependency tree must contain regular files rather than linked package directories; unsupported layouts fail instead of being silently traversed.

For offline production-mode serving, set `AFTERCLOSE_DEPLOYMENT_MODE=synthetic` in the process running `npm start`. For example, in PowerShell:

```powershell
$env:AFTERCLOSE_DEPLOYMENT_MODE = 'synthetic'
npm start
```

Local live-provider development is a separate, explicit action: use a new terminal with both mode variables unset, configure your own AfterClose `BINANCE_API_KEY` and `BINANCE_SECRET_KEY` privately, then `npm run dev`; a production-mode live server additionally requires `AFTERCLOSE_DEPLOYMENT_MODE=competition-live`. Leave `AFTERCLOSE_PREVIEW_MODE` unset in that case. Never overwrite an existing `.env.local`; `.env.example` contains names/placeholders only. `BINANCE_WEB3_BASE_URL` is optional and accepts only the pinned official base. BSC 56 is validated in source; no public environment variable is required. `NODE_USE_SYSTEM_CA=1` is an optional existing-system-trust setting for affected local Node installations, not a TLS bypass or hosting requirement.

Live diagnostics (`test:api`, capture/benchmark/host-verification scripts) can consume provider quota. They are **not** part of offline reproduction. Deployment/invocation scripts in historical runbooks require separate owner approval; do not run them to judge this proof.

## Credential and optional historical-harness checks

Maintainers who already possess the project's local credentials can run `node scripts/scan-known-credentials.mjs --counts-only .tools/public-live-release/dist .next`. It compares values in memory without printing them. It deliberately fails when no known values are available; judges should use the credential-pattern and client-boundary scans above instead.

Old browser-harness scripts require optional Playwright installations under their documented `.tools` directories and a local Microsoft Edge browser. They are retained for historical QA, not silently installed by `npm ci` or required for the 190-test baseline. The current manual UI paths above work without those ignored tools. Historical hosted URLs describe AfterClose experiments, not additional services needed for reproduction.
