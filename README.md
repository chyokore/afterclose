# AfterClose

**Understand the gap before the decision.**

Tokenized stocks can trade when their underlying equity reference is stale, missing or based on a different unit. AfterClose makes those gaps in evidence visible before anyone interprets a price difference.

This is a read-only hackathon research preview. **No public deployment exists. No wallet execution exists.**

## One-minute demonstration

1. Open `/` on the locally running application. Inspect NVDAon, source timestamps and the current **WAIT** explanation.
2. Open `/demo` using the prominent scenario-lab link. Compare stale-reference, fresh-evidence and missing-multiplier scenarios.
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
| Next.js App Router | Server-rendered live dashboard, refresh control, loading/error UI and a separate scenario route |
| Binance Web3 client | Server-only authenticated GET requests to platforms, tokens, search, price and underlying-market; pinned official host, TLS verification, timeouts and Zod validation |
| Ondo page adapter | Read-only issuer metadata; exact decimal string, matching contract, no invented effective timestamp |
| Nasdaq schedule | Manually reviewed public calendar, New York DST, holidays and bounded hours coverage; not live security status |
| Reference Truth Engine | Pure validated assessment; no network or execution capability |
| Synthetic lab | Twelve fictional scenarios with a frozen clock; no live API calls or production fallback |

Binance's five RWA endpoints have returned HTTP 200/code 0 in recorded live work. Its `referencePrice` is token-derived, not an independent NVIDIA equity quote. The issuer-reported ratio has no verified effective/expiry interval. The calendar expires after seven days without review and stops before the announced December 6, 2026 hours change. Reloading does not renew that source review.

| Decision | Meaning |
| --- | --- |
| WAIT | Critical evidence is missing, invalid, contradictory, stale or fails a configured check |
| MONITOR | A gap can be compared, but interpretation or executability is uncertain |
| PROCEED_TO_REVIEW | Configured evidence checks pass for review only; no recommendation, profit guarantee or automatic trade |

The live engine remains WAIT. Two independent equity providers, current multiplier applicability, authoritative market/security status, liquidity and executable quote evidence remain unresolved. Thresholds are conservative research defaults, not calibrated trading advice.

## Local setup

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

## Validate and run the production build

```sh
npm test
npm run lint
npm run build
npm start
```

`npm run test:api` is a separate read-only live Binance diagnostic. It loads the local environment securely. Missing credentials cause skipped requests, not a successful connectivity result. Automated tests use synthetic responses and captured historical structures; those tests do not establish current API availability.

Ages and engine decisions are evaluated at a snapshot. A client-side notice asks for reassessment when that snapshot becomes historical; it does not refetch automatically or change price timestamps.

## Demo and deployment status

Local demonstration is supported; **public deployment has not been approved or performed**. The app needs a Node server, not static-only hosting. [Deployment readiness](docs/deployment.md) covers Vercel and a standard Node host, environment isolation, outbound access, quotas, licensing and approval gates. It is a runbook, not a claim that a hosted environment was tested.

[Demo/visual QA record](docs/qa/demo-readiness.md) includes reproducible desktop/mobile checks and known inspection limits. [Developer Experience diary](docs/devex/README.md) records actual work, including failed attempts and AI assistance.

## Known limitations

- No independent live equity quotes or associated display entitlements.
- Issuer public-page structure is fragile; changes fail closed. An observed ratio is not current applicability, and BSC display scaling still needs reconciliation.
- Published schedules do not establish live exchange status, absence of security halts or quote availability.
- No wallet, signed transaction, approval, swap, RFQ submission, simulation or broadcast integration.
- Each live render can make five Binance requests and one issuer request. No distributed rate limiter or shared cache exists; unrestricted public traffic is not ready without host/provider quota controls.
- No fallback live prices. Network and schema failures are visible, actionable states.

Research: [issuer/session evidence](docs/research/issuer-multiplier-and-session.md), [execution feasibility](docs/research/binance-execution-evidence.md), [independent providers](docs/research/underlying-equity-providers.md). This repository is independent of Noctive and uses none of its files, assets or infrastructure.

## Restricted synthetic preview

The [exact restricted-preview plan](docs/deployment/restricted-preview-plan.md) is awaiting approval. **NO HOSTED DEPLOYMENT HAS OCCURRED.** Use server-only `AFTERCLOSE_PREVIEW_MODE=synthetic` for a fictional dashboard and all 12 scenarios. Live adapters reject requests in this mode, even with credentials present. Refresh repeats frozen fixtures. Invalid values fail closed; missing mode on Vercel also fails closed. For the existing local live workflow, leave the flag unset.

With Node 24, run `node scripts/rehearse-synthetic.mjs` for an isolated production build/server rehearsal with no env files or provider secrets and server fetch interception. It retains ignored artifacts under `.tools`, binds only loopback, and stops its server after checking routes, RSC refresh and assets. This does not validate hosted authentication. The Vercel config disables Git auto-deploys; no hosting connection is created by that file.
