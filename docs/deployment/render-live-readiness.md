> Historical AfterClose milestone/runbook. Current release: [Cloudflare + Supabase](public-live-release.md); current judge path: [proof index](../submission/proof-index.md). Historical commands are not authorization to deploy or alter accounts.

# Render live hosting readiness
Reviewed 2026-10-06. Scope: research, code hardening and local rehearsal only. No hosting changes authorized.

## Recommendation
CONDITIONAL GO for a small competition demonstration on one Free Node web service in a Hobby workspace. This is not an always-on production recommendation. The existing https://afterclose-preview.pages.dev/ synthetic fallback remains unchanged. No alternative host is needed unless the account or network gates below fail.

## Current official capabilities
| Area | Verified behavior and consequence |
|---|---|
| Node / Next | [Next.js guide](https://render.com/docs/deploy-nextjs-app) supports a Node web service with custom build/start commands. Use the full server, not a static export. |
| Version | [Node selection](https://render.com/docs/node-version) supports NODE_VERSION and .nvmrc. Pin 24.21.0, the local rehearsal version. |
| URL / TLS | [Web services](https://render.com/docs/web-services) provide an onrender.com hostname and managed HTTPS. Listen on 0.0.0.0 and PORT. No domain purchase or DNS change. |
| Secrets | [Environment variables](https://render.com/docs/configure-environment-variables) configure private server environment values. Values can also reach build processes: our child builder strips the environment and excludes .env files. Host administrators remain trusted. |
| Egress | [Outbound networking](https://render.com/docs/outbound-ip-addresses) uses region-dependent shared ranges. HTTPS is feasible; authenticated Binance access from the chosen region is NOT proven by local success. |
| Compute | [Compute plans](https://render.com/docs/compute-plans): explicitly select Free, 0.1 CPU / 512 MB. Never accept an implicit paid default. Local Windows rehearsal does not prove Linux memory/CPU fit. |
| Idle / hours / storage | [Free services](https://render.com/docs/free): sleeps after 15 idle minutes, wakes in roughly one minute with Render's own loading page, shares 750 monthly instance hours, and loses local files on sleep/restart/redeploy. No free persistent disk. Free rollback reaches only two prior deploys. |
| Service limits | The same free-service documentation warns that unusually high outbound API traffic can suspend a service and require a paid upgrade to restore. One instance; no SSH, scaling or production SLA. Accept suspension rather than paying. |
| Bandwidth | [Outbound bandwidth](https://render.com/docs/outbound-bandwidth): Hobby includes 5 GB/month. With a payment method, excess is billed; without one, services pause until reset. Monitor workspace totals, not only this app. |
| Build | [Build pipeline](https://render.com/docs/build-pipeline): Hobby Starter has 500 monthly minutes, 2 CPU / 8 GB build RAM; 16 GB disk ceiling and 120-minute build timeout. Additional minutes are automatically purchased if a payment method and spend allowance exist; otherwise builds stop. Configure zero additional spend. |
| Logs | [Logging](https://render.com/docs/logging): stdout/stderr available, Hobby retention seven days, 6,000 lines/minute/instance limit. Our provider warnings contain endpoint enum and HTTP status only. Never enable request/header/environment dumps. |
| Health | [Health checks](https://render.com/docs/health-checks): HTTP GET must respond with 2xx/3xx within five seconds. /api/health checks configuration only, never provider availability. Invalid configuration returns 503; Render may restart unhealthy instances. |
| Git | [Deploys](https://render.com/docs/deploys): connected Git providers enable automatic deployments; public repository URL deployments are manual. Use the public repository URL and reviewed branch; keep auto-deploy off. No GitHub connection was made. |
| Payment | [First deployment](https://render.com/docs/your-first-deploy) says no payment is required; Render's [free-tier article](https://render.com/articles/platforms-with-a-real-free-tier-for-developers-in-2026) advertises no card requirement. This is not verification of this owner's account flow. Stop if card verification, authorization hold, trial, upgrade or payment is required. |

## Exact intended commands
Node 24.21.0. Install: `npm ci --include=dev --ignore-scripts --no-audit --no-fund`.
Build: `node scripts/build-live-safe.mjs`.
Start: `node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port $PORT`.
Render build field combines installation and build with `&&`. Health: `/api/health`.
Required runtime names: AFTERCLOSE_DEPLOYMENT_MODE, BINANCE_API_KEY, BINANCE_SECRET_KEY. Host supplies PORT; pin NODE_VERSION. No public credential variables.
The isolated builder disables Turbopack persistent caching, omits .env files, uses an environment allowlist and blocks fetch. Do not replace it with ordinary next build or persist .next/cache.
Local commands invoke the bundled Node executable directly; loopback ports replace the host's PORT. This validates Next's production server, not Render infrastructure.

## Evidence and resource behavior
Only one provider capture can be active per process. Six fixed Binance GETs (four discovery then two quote/market) and one anonymous Ondo page; no retry. Success cooldown 30 seconds, failure cooldown 60 seconds, measured after completion. Maximum four concurrent Binance requests plus one issuer request. Each Binance request/body has a 12-second abort and 2 MB cap; issuer has its own bounded request. A completed six-request cycle cannot occur more than twice per minute in steady state. Process restart resets these limits; horizontal scaling would require redesign.
Refresh re-evaluates cached evidence with original provider and observation clocks. Receipt timestamps record evaluation separately. Client freshness ages using elapsed monotonic time. No background polling or keepalive cron.
Snapshots are best effort, local and historical. Loss is expected; no database or paid persistence is proposed. Receipt hashes establish integrity, not independent provider authenticity.
The application loading state begins only once Next can respond. It cannot replace Render's platform cold-start page. Retry and Scenario Lab remain available after application-level failures; while the entire service sleeps, use the existing static fallback.

## Approval gates
1. Owner verifies Free compute, Hobby workspace, no card/trial/payment requirement and zero additional pipeline spend; no payment method added.
2. Owner accepts sleeping service, possible quota suspension, transient snapshots and no uptime guarantee.
3. After separate deployment authorization, verify clean Linux build/start within resource limits, health identity, genuine Binance authentication from the selected region, and the hosted verification checklist. Failure means take the live service offline and retain the static fallback.
Independent equity, dated multiplier and execution evidence remain unavailable; WAIT is the correct demonstration, not a deployment blocker.
