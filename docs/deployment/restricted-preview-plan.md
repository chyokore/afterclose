# Restricted synthetic preview — approval plan

Prepared October 5, 2026 from starting commit `4f33b77717aa72db8281beeeb0c60a0a61639f8b`. This plan supersedes the live-provider instructions in `docs/deployment.md` for this milestone. Noctive is outside scope and was not accessed.

## Proposed destination and restriction

Use a separate AfterClose-only Vercel project, with **Vercel Authentication / All Deployments**, no protection exceptions, no shareable bypass links, no automation bypass secrets, no trusted-source bypass and no OPTIONS allowlist. Access is limited initially to the owner; grant a named reviewer access only after explicit approval. An obscure URL and robots noindex are not authentication.

Current official documentation inspected October 5, 2026:

- [Protection scope](https://vercel.com/docs/deployment-protection): authentication applies to all requests, including middleware; All Deployments covers production domains and generated deployment URLs. This scope includes page, RSC, static-asset and server-endpoint requests; verify each class on the actual host.
- [Protection pricing](https://vercel.com/docs/deployment-protection/usage-and-pricing): Authentication and All Deployments are included on Hobby, Pro and Enterprise with no protection add-on. Password Protection is unavailable on Hobby, costs $20/month/project on current Pro billing, and is included on Enterprise; legacy packages differ. Password protection is not proposed.
- [Vercel Authentication](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication): authorized Vercel accounts can access; external account grants can be revoked. Hobby permits one external user per account. Do not issue bearer share links.
- [Hobby](https://vercel.com/docs/plans/hobby) is free for personal non-commercial use. Proposed initial plan: Hobby, owner-only, conditional on user confirming eligibility. If commercial use or additional reviewers are required, stop for a revised billing approval: [Pro](https://vercel.com/docs/plans/pro-plan) starts at $20/month including one deploying seat and usage credit, with additional usage/seat charges. No purchase is authorized.
- [Deployment environments](https://vercel.com/docs/deployments/environments): the first deployment of a new project is always production, even without `--prod`. Generated project/production aliases must therefore be protected before any upload. Later deployments may target Preview. Do not promise a preview-only initial deployment.

Older search snippets described All Deployments as paid; freshly opened official pages, updated September 15, 2026, supersede those snippets. Account entitlement and actual settings have not been inspected. If protection cannot be enabled and verified before the first upload, **stop: hosting is blocked**. Do not briefly expose the project while configuring protection.

## Exact proposed sequence — all hosted steps UNPERFORMED

1. After approval, select the user's AfterClose account, confirm Hobby eligibility and owner identity. Create an empty, unconnected project without deploying or importing Git. If that workflow is unavailable, stop and revise the plan.
2. Before uploading app files, enable Authentication / All Deployments and inspect every bypass/exception setting. Record evidence of the saved setting. Keep Git disconnected; code pushes must not trigger hosting.
3. Set the safe variables below in BOTH Production and Preview scopes, including build and runtime. Check that inherited/shared/team environments contain no provider secrets. Never import local env files.
4. Prepare a fresh export of the approved commit containing only application source, lockfile, package manifest and required build configuration. Exclude `.env*`, `.tools`, `.next`, `.git`, captures, diary screenshots, tests and diagnostic scripts. Do not upload the developer working directory.
5. Upload that reviewed source manually to the already-protected project. Accept Vercel's first-deployment Production classification only with the prior protection verified. No custom domain, DNS change, Git connection, auto-deploy or public sharing. Later uploads explicitly target Preview.
6. Run the hosted checks below before sharing any generated URL with the approved reviewer. A protection failure requires immediate shutdown, not a weaker gate.

Expected URL type: Vercel-generated HTTPS deployment URL under `vercel.app`, plus any generated project/branch aliases. No actual hostname exists or is invented in this plan. The first project production alias is potentially public by default; our required All Deployments setting must cover it. Inventory all aliases from the actual deployment, including older deployment URLs after subsequent uploads.

## Build and environment

Next.js preset, repository/export root, Node **24.x**, `npm ci`, `npm run build`, default Next.js output; no static export or Edge runtime. Vercel manages function serving. On a conventional Node host the equivalent start command is `npm start`; local rehearsal binds `next start --hostname 127.0.0.1 --port 3187`.

| Variable | Exact safe value / treatment |
| --- | --- |
| `AFTERCLOSE_PREVIEW_MODE` | `synthetic`, server-only, required at build AND runtime in Production and Preview |
| `NEXT_TELEMETRY_DISABLED` | `1` |
| `NODE_ENV` | `production`, framework-managed for build/start |
| `VERCEL`, `VERCEL_ENV` | Platform-managed; never spoof/override. Presence with missing preview mode rejects live access. |

No other app variables are required. In particular do **not** upload `BINANCE_API_KEY`, `BINANCE_SECRET_KEY`, `BINANCE_WEB3_BASE_URL`, independent equity/Ondo provider credentials, wallet private keys/seed phrases, RPC/transaction API secrets, `VERCEL_TOKEN`, local certificates, `NODE_USE_SYSTEM_CA`, `NODE_EXTRA_CA_CERTS`, `NODE_TLS_REJECT_UNAUTHORIZED`, `NODE_OPTIONS`, `.env.local`, or any `NEXT_PUBLIC_*` secret. `NEXT_PUBLIC_BSC_CHAIN_ID` is unused and unnecessary. Any host-management authentication stays outside the app environment. Rehearsal-only `AFTERCLOSE_NETWORK_AUDIT` and preload settings are not hosting configuration.

## Route and data-access audit

| Surface | Original exposure and synthetic behavior |
| --- | --- |
| `/`, server component | Originally invoked `loadDashboard`, five Binance endpoints and Ondo in parallel and rendered historical ratio/contract text. Now selects a separate synthetic component BEFORE loading live evidence. No historical discovery markup is rendered in preview. |
| `/demo`, all scenario queries | Twelve fictional fixtures, frozen clock, pure engine. Explicit mode validation; unknown scenario selects labeled stale-reference case. No captured fixture imports. |
| Root layout / metadata | Server-controlled mode validation; persistent exact `SYNTHETIC DEMO — NOT LIVE MARKET DATA` banner, synthetic description/title, noindex/nofollow. No remote fonts, images or social-image fetch. Lab metadata is already synthetic. |
| Loading, error/reset, 404 | Loading copy is mode-neutral and explains fictional fixtures. Layout retains banner around loading/error/not-found content. Error objects remain hidden; retry re-enters guarded server render. Invalid configuration may produce generic framework 500 without layout: it displays no market observation. |
| Refresh, navigation, prefetch, RSC | `router.refresh()` uses the same guarded server route, with synthetic button wording. No query/header/client flag can select live mode. Snapshot notice is live-only and performs no fetch. |
| `loadDashboard`, `loadRwa`, `rwaGet`, Ondo reader | All reject synthetic/invalid modes before entering provider logic, even if credentials accidentally exist. Guards are outside provider catch/fallback blocks. All five exported Binance endpoints flow through `rwaGet`. |
| Equity adapter / calendar / engine | Equity adapter is unavailable-only with no transport; schedule and engine are pure. Synthetic dashboard uses neither the real calendar nor captured issuer evidence. Future provider adapters must adopt the same guard and tests. |
| API routes / server actions / wallets | No route handlers, server actions, wallet SDK, RFQ submission, transaction or broadcast endpoint exists. Hypothetical `/api/*` requests return 404. Hosting protection must still cover those paths. |
| Build, static assets and caches | Pages are dynamic. No build-time provider call is needed. No public capture directory or service worker exists. Historical fixtures remain in tests/docs/local ignored tools, never preview inputs. Browser assets must not include historical observations or secrets. Server bundles still contain guarded local-live code; they are not public assets. |
| CLI diagnostic | `test:api` is local-live only and must never run during build/deploy; provider guards also block it in synthetic mode. |

Local live development remains available with `AFTERCLOSE_PREVIEW_MODE` **unset** and no Vercel markers. Explicit empty, `live`, misspelled or unknown values fail closed. Unset mode outside Vercel intentionally preserves the local workflow; a different host would need an enforced synthetic flag and an equivalent host marker policy before approval.

Synthetic prices are fictional fixtures, never substitutions for failed live evidence. Fictional quote/liquidity checks illustrate engine rules and never claim a live executable quote or execution result. Refresh preserves the frozen demonstration clock.

## Hosted acceptance procedure — NOT performed

For every deployment, branch and production alias, use a fresh signed-out browser and cookie-free HTTP client with no bypass headers/tokens. Test `/`, `/demo`, each scenario query, unknown paths, `/api/probe`, RSC requests (`RSC: 1`), and the actual JS/CSS asset URLs copied from an authorized session. Test GET and HEAD; examine redirects and response bodies, not just status codes. Anonymous callers must receive an authentication gate and no app HTML, Flight payload or asset body. OPTIONS must not bypass the gate. A signed-in unapproved account must also be denied. Verify approved account access, then revoke a temporary test reviewer and confirm loss of access. Never use a CLI that silently adds protection bypass credentials for these checks.

While authenticated: inspect dashboard and all 12 scenarios, refresh repeatedly, test unknown scenario/404, observe loading/error copy, inspect HTML/RSC/browser bundles and metadata for synthetic labels and absence of real captures. Record a browser request log; all app requests must be same-origin (Vercel login is separate). Inspect server logs and outbound telemetry for zero provider requests. Verify build/runtime environment names only, without logging secret values. Repeat after configuration changes. Local interception is evidence for current application paths, not proof of the host's network policy or authentication.

## Rollback and shutdown — only after deployment approval

Keep All Deployments protection enabled. Revoke reviewer grants and bypass links/tokens if any are found. Stop new uploads/auto-deploy triggers. Delete the failed deployment and its aliases; for complete shutdown remove all deployments and the dedicated project, then verify every recorded URL no longer serves app content. Never disable Authentication as a shutdown technique. Roll back only to a previously verified synthetic commit/build with identical safe environment and protection; the starting live-only commit is NOT an acceptable hosted rollback. Remove any paid resources/subscriptions separately after user authorization.

## Local validation record

Completed locally: 86/86 tests; ESLint; full-checkout TypeScript; isolated production build; dashboard and 12 scenarios; unknown scenario and 404; three RSC refreshes; eleven browser assets; invalid runtime mode rejection; zero intercepted server fetch attempts with no provider secrets/env files. Credential pattern scan found no matches. Servers were stopped after rehearsal. Source checks cover loading/error wording; no new visual browser QA is claimed.

See [Developer Experience record](../devex/restricted-preview.md) for exact results, failures fixed and limitations. Hosted authentication, account eligibility, aliases and revocation remain untested until approved. No local test establishes restricted hosting.

## Approval checklist

**NO HOSTED DEPLOYMENT HAS OCCURRED.**

- [ ] Approve Vercel, the dedicated AfterClose project and owner-only initial audience; confirm personal non-commercial Hobby eligibility (otherwise request a revised paid plan).
- [ ] Approve creating the empty project and configuring Authentication / All Deployments before any upload.
- [ ] Approve setting only the listed safe environment variables in both scopes.
- [ ] Approve uploading the reviewed source and the initially Production-classified deployment with all aliases protected; later Preview uploads require their own approved scope.
- [ ] Approve executing the hosted access/synthetic checks and sharing the resulting protected URL with explicitly named reviewers only.
- [ ] Approve shutdown/removal of this dedicated preview if any protection/isolation check fails.

Git connection, automatic deployments, DNS/custom domains, public access, provider credentials, live data and payments are excluded from this proposal and each would need a separate explicit approval. Stop before any hosted action. Please approve this exact plan before proceeding.
