# AfterClose

**Understand the gap before the decision.**

Tokenized stocks can trade when their underlying equity reference is stale, missing or based on a different unit. AfterClose makes those gaps in evidence visible before anyone interprets a price difference.

This is a read-only hackathon research application. The [public demo](https://afterclose-preview.pages.dev/) is the judge entry for Live Evidence and the separate [12-case synthetic Scenario Lab](https://afterclose-preview.pages.dev/lab/#/lab/fresh-evidence). Check the [release record](docs/deployment/public-live-release.md) for deployment status, source commit and validation. No wallet or execution capability exists. Use the [release branch](https://github.com/chyokore/afterclose/tree/codex/cloudflare-live-integration) for this README; main is not automatically merged.

## One-minute demonstration

1. Open the public demo and select **Refresh Live Evidence** once. Inspect rediscovered NVDAon, separate provider/observation timestamps, evidence classification and **WAIT** explanation. Expand the receipt, copy its SHA-256, verify its integrity and download it.
2. Open **Scenario Lab**. Compare stale-reference, market-closed and fresh-evidence scenarios, explicitly labeled synthetic.
3. Explain the distinction: a successful API response is not a fresh equity quote; a passing synthetic review case is not evidence of a profitable real trade.

WAIT is an evidence-quality result, not a token safety rating or a buy/sell recommendation.

## What makes it different

- A Reference Truth Engine separates provider price time, issuer applicability and AfterClose observation time.
- Explicit provenance distinguishes token-derived pricing from independent equity data.
- Missing or contradictory evidence stays missing; an outage never becomes a synthetic market quote.
- Review eligibility includes freshness, provider disagreement, unit normalization, session, liquidity and quote checks. It never triggers execution.

## Supported research asset

BNB Smart Chain mainnet, chain **56**: Ondo **NVDAon**, referencing NVIDIA / NVDA.

Contract: `0xa9ee28c80f960b889dfbd1902055218cba016f75`.

The Binance-discovered identity was corroborated by the official Ondo asset page. This does not establish tradability through Binance's RFQ service. That quote test requires wallet context and was not performed.

## Architecture and provenance

| Layer | Responsibility |
| --- | --- |
| Cloudflare Pages | Static public Live Evidence frontend and isolated synthetic lab; no server runtime or browser credentials |
| Supabase Frankfurt | Fixed public read-only gateway, authenticated provider requests, exact production/staging CORS, per-isolate cache and cooldown |
| Next.js App Router | Retained local development dashboard at `/live` and `/demo`; not the public hosting runtime |
| Binance Web3 client | Server-only authenticated GET requests to platforms, tokens, search, price, underlying-market and supported chains; pinned official host, TLS verification, timeouts and Zod validation |
| Ondo page adapter | Read-only issuer metadata; exact decimal string, matching contract, no invented effective timestamp |
| Nasdaq schedule | Manually reviewed public calendar, New York DST, holidays and bounded hours coverage; not live security status |
| Reference Truth Engine | Pure validated assessment; no network or execution capability |
| Synthetic lab | Twelve fictional scenarios with a frozen clock; no live API calls or production fallback |
| Competition evidence | Deterministic freshness, canonical SHA-256 receipts, offline verifier and local snapshots always displayed as historical |

Binance's five RWA endpoints have returned HTTP 200/code 0 in recorded live work. Its `referencePrice` is token-derived, not an independent NVIDIA equity quote. The issuer-reported ratio has no verified effective/expiry interval. The calendar expires after seven days without review and stops before the announced December 6, 2026 hours change. Reloading does not renew that source review.

| Decision | Meaning |
| --- | --- |
| WAIT | Critical evidence is missing, invalid, contradictory, stale or fails a configured check |
| MONITOR | A gap can be compared, but interpretation or executability is uncertain |
| PROCEED_TO_REVIEW | Configured evidence checks pass for review only; no recommendation, profit guarantee or automatic trade |

The live engine remains WAIT. Two independent equity providers, current multiplier applicability, authoritative market/security status, liquidity and executable quote evidence remain unresolved. Thresholds are conservative research defaults, not calibrated trading advice.

## Local setup

For the credential-free static frontend build (Node 24 with installed dependencies):

```sh
npm ci
node scripts/build-static-preview.mjs
node scripts/build-public-live.mjs
```

The deployable files are in `.tools/public-live-release/dist`. They call only the public Frankfurt gateway, which accepts the exact deployed production and staging origins; localhost is intentionally not authorized. `--fixture` builds a separate local QA artifact, never a deployable live artifact. The local fixture server requires the developer's ignored sanitized capture file and is not part of the judging setup. For local live-provider development, use the existing Next.js path below.

The public page never auto-fetches. It coalesces an in-flight request, persists a 45-second tab-session cooldown across navigation, respects Retry-After and waits at least 60 seconds after failure. No polling or automatic retry exists. These controls do not create a global rate limiter. The gateway requires no browser Authorization header, API key or privileged Supabase credential; provider credentials remain server-only. CORS is a browser boundary, not protection against non-browser callers. The fixed route cannot proxy arbitrary URLs or assets.

### Receipt verification

The browser recomputes SHA-256 over canonical receipt JSON. This is content integrity, not an independent engine run or provider authentication. Download the envelope and run the existing canonical verifier:

```sh
node --conditions=react-server --import tsx scripts/verify-evidence-receipt.ts afterclose-evidence-receipt.json DISPLAYED_SHA256
```

It checks schema, canonical bytes, digest and deterministic engine reproduction. Historical committed receipts are evidence records only, never live fallbacks. If the gateway fails, the page displays **LIVE EVIDENCE TEMPORARILY UNAVAILABLE** and offers the separate synthetic lab.

Submission preparation: [owner evidence outline](docs/submission/developer-experience-evidence.md), [3–4 minute video script](docs/submission/demo-script.md), [submission checklist and unresolved track eligibility](docs/submission/checklist.md). No report, video or form submission is claimed complete.

Use **Node.js 24.x** and npm. The lockfile is committed.

```sh
npm ci
# Create .env.local from .env.example only if it does not already exist.
npm run dev
```

PowerShell: use `Copy-Item .env.example .env.local` only if the local file does not already exist. Privately configure credentials there; never overwrite an existing credential file while following setup instructions. With no credentials, the live dashboard shows setup required and the synthetic lab remains usable.

Environment variable names only:

| Name | Scope |
| --- | --- |
| `BINANCE_API_KEY` | Required server-only Binance credential for live RWA access |
| `BINANCE_SECRET_KEY` | Required server-only signing secret |
| `BINANCE_WEB3_BASE_URL` | Optional server configuration; only the documented pinned host is accepted |
| `NEXT_PUBLIC_BSC_CHAIN_ID` | Non-secret legacy configuration; runtime schemas enforce BSC 56 |
| `NODE_USE_SYSTEM_CA` | Optional local Node trust configuration where an existing system CA is required |

There is no Ondo API key or independent equity provider key configured by this application. Do not prefix secret names with `NEXT_PUBLIC_`. The development machine's existing system trust was necessary for verified TLS; do not copy local certificates to a host or disable certificate validation. See the recorded [TLS diagnostics](docs/devex/live-verification.md).

For the retained local Next.js production-mode build, use `npm run build:live-safe`, then `npm start`. The builder excludes environment files and provider credentials, denies outbound requests, and writes `.next` only after a successful isolated build. Runtime reads the existing server credentials. Persistent Turbopack filesystem caches are disabled: a previous exact binary scan found local credential values in ordinary-build cache files, and those files were removed. Run both `scripts/scan-credentials.mjs` and `scripts/scan-known-credentials.mjs` against generated output before publishing any future deployment. This Next.js build is not the Cloudflare Pages artifact.

## Validate and run the local Next.js build

```sh
npm test
npm run lint
npm run build:live-safe
npm start
```

`npm run test:api` is a separate read-only live Binance diagnostic. It loads the local environment securely. Missing credentials cause skipped requests, not a successful connectivity result. Automated tests use synthetic responses and captured historical structures; those tests do not establish current API availability.

Ages and engine decisions are evaluated at a snapshot. A client-side notice asks for reassessment when that snapshot becomes historical; it does not refetch automatically or change price timestamps.

## Demo and deployment status

The public Cloudflare Pages frontend and Supabase Frankfurt gateway are deployed and verified. [Current release evidence](docs/deployment/public-live-release.md) records staging-first promotion, exact source/artifact identities, browser checks and rollback. The older [Node deployment readiness](docs/deployment.md) is retained as historical research; it does not describe the public static frontend architecture.

[Demo/visual QA record](docs/qa/demo-readiness.md) includes reproducible desktop/mobile checks and known inspection limits. [Developer Experience diary](docs/devex/README.md) records actual work, including failed attempts and AI assistance.

## Known limitations

- No independent live equity quotes or associated display entitlements.
- Issuer public-page structure is fragile; changes fail closed. An observed ratio is not current applicability, and BSC display scaling still needs reconciliation.
- Published schedules do not establish live exchange status, absence of security halts or quote availability.
- No wallet, signed transaction, approval, swap, RFQ submission, simulation or broadcast integration.
- A gateway cache miss can make six fixed Binance requests and one issuer-page request. Cache/cooldown are per worker; there is no distributed rate limiter or shared cache. Browser safeguards reduce accidental requests but cannot coordinate arbitrary callers. This is a bounded competition demonstration, not a high-traffic service.
- No fallback live prices. Network and schema failures are visible, actionable states.

Research: [issuer/session evidence](docs/research/issuer-multiplier-and-session.md), [execution feasibility](docs/research/binance-execution-evidence.md), [independent providers](docs/research/underlying-equity-providers.md). This repository is independent of Noctive and uses none of its files, assets or infrastructure.

## Historical local synthetic rehearsal

The older [restricted-preview plan](docs/deployment/restricted-preview-plan.md) is historical. The public synthetic-only deployment is preserved as a rollback target, and the current public lab is at `/lab/`. For local Next.js rehearsal, use server-only `AFTERCLOSE_PREVIEW_MODE=synthetic` for a fictional dashboard and all 12 scenarios. Live adapters reject requests in this mode, even with credentials present. Refresh repeats frozen fixtures. Invalid values fail closed; missing mode on Vercel also fails closed. For the existing local live workflow, leave the flag unset.

With Node 24, run `node scripts/rehearse-synthetic.mjs` for an isolated production build/server rehearsal with no env files or provider secrets and server fetch interception. It retains ignored artifacts under `.tools`, binds only loopback, and stops its server after checking routes, RSC refresh and assets. This does not validate hosted authentication. The Vercel config disables Git auto-deploys; no hosting connection is created by that file.
