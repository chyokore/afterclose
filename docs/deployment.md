# Historical Node-host readiness

This September 26 runbook describes an earlier AfterClose architecture. The current public release uses a static Cloudflare Pages frontend and a Supabase Frankfurt gateway: see [release evidence](deployment/public-live-release.md) and [current reproduction](reproduction.md). No command in this historical runbook authorizes deployment. `npm run build` now invokes the isolated safe builder; a local production-mode live server also requires `AFTERCLOSE_DEPLOYMENT_MODE=competition-live`, with the legacy preview mode unset. The browser needs no application environment variables.

# Deployment readiness — not deployed

Reviewed September 26, 2026. This is a proposed runbook for AfterClose only. Do not create a deployment, connect hosting auto-deploys, publish a preview or attach a public domain until the user approves the destination and exposure. No host was provisioned in this milestone.

## Runtime choice

Use Next.js on Node 24.x. The repository declares Node >=24 <25, uses server crypto and server-only modules, and dynamically renders `/`. A Node server supports the required features; static export cannot replace authenticated runtime data retrieval. See [Next.js deployment documentation](https://nextjs.org/docs/app/getting-started/deploying).

Vercel is a possible host: its [supported versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) include Node 24.x, with host-managed minor/patch releases. Compatibility has been tested locally only. Select the Next.js preset, repository root, lockfile-based install, `npm run build`, and Node runtime. Do not use Edge or a static export.

For another Node host, run `npm ci`, `npm run build`, then `npm start` behind the host's HTTPS ingress. Bind to the host-required port/interface. Use a separate AfterClose service and secret store; do not reuse another project's infrastructure.

## Environment isolation

Required secret names: `BINANCE_API_KEY`, `BINANCE_SECRET_KEY`.

Optional names: `BINANCE_WEB3_BASE_URL`, `NODE_USE_SYSTEM_CA`.

Set secrets privately in the approved host's environment manager. Restrict them to the approved environment; do not make credentials available to untrusted pull-request builds. Vercel supports [sensitive environment variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables). Never put secret values in Git, public variables, project screenshots or logs. Do not upload `.env.local`, `.tools`, cached builds or local CA certificates.

The client pins `https://web3.binance.com/build`; alternate hosts and redirects are rejected before credentials can be forwarded. Ondo's public page reader sends no Binance credentials. Normal host TLS must work with verification enabled. The local Windows system-CA workaround is not proof of hosted connectivity and should not be blindly copied to production.

## Server/client boundary audit

- `src/lib/binance/client.ts`, `rwa.ts`, `src/lib/issuer/ondo.ts`, and `src/lib/evidence/load-dashboard.ts` import `server-only`.
- The live route uses Node runtime and dynamic rendering. Only sanitized evidence and display parameters cross to client components.
- Client components refresh the route, display snapshot-age notices or offer a generic error retry; they do not import API credentials or fetch signed requests.
- The auth helper accepts secrets as arguments; it is consumed by server code and the local diagnostic, never a client component.
- API logs include known endpoint and HTTP status only. Provider bodies, signature values and raw error objects are not logged or rendered by the application error UI. Host observability tooling must retain this policy too; local checks cannot audit a future host's configuration.
- Production sources do not import demo fixtures. `/demo` is explicitly synthetic and never calls the live loader.
- Production navigation uses relative local routes or public source URLs, not hardcoded localhost links.

## Failure, cache and traffic behavior

Binance requests use `cache: no-store`, a 12-second request timeout and no redirect following. Three dependent stages can take roughly 36 seconds plus parsing/render overhead; issuer retrieval runs alongside them with an eight-second timeout. Verify a host function duration comfortably covers this workload, for example a 60-second budget where supported. [Vercel duration limits](https://vercel.com/docs/functions/limitations) vary with plan and compute settings; inspect the actual selected environment before approval.

HTTP/authentication, timeout, rate-limit, schema and empty discovery states withhold unusable live evidence and show controlled next steps. Unexpected rendering errors get a generic boundary. Missing token price remains missing even if metadata validated. No failed live request loads a synthetic or historical substitute.

No automatic polling, retry loop, shared result cache or distributed limiter is implemented. Refresh disables while pending but is not quota enforcement. Each visitor/render may trigger five Binance requests plus one Ondo page request. The documented Binance defaults include endpoint limits as well as key/IP/user limits; see the [execution research](research/binance-execution-evidence.md). Cold starts and parallel visitors share provider quotas. A host-level request budget/protection or a deliberately limited audience is needed before public traffic; do not describe this as load-tested.

If a future shared cache is introduced, retain original response observation and market timestamps, disclose age, bound its TTL and never cache per-wallet execution context indiscriminately. Page reload must not reset the Nasdaq calendar source-review date. That snapshot expires after seven days and excludes December 6 onward pending new-hours review.

## Approval and acceptance gates

1. Select the approved host, environment, region, spending limits and access protection. Confirm provider display rights and issuer-page usage before public distribution; readable documentation alone grants no quote redistribution license.
2. Configure only AfterClose credentials privately. Validate DNS/TLS and authenticated read-only Binance access from the actual host; local VPN success is not transferable proof.
3. Run all tests, lint, production build and credential scans. Inspect built browser assets, rendered HTML, logs and environment scope. Do not print credential values while scanning.
4. Exercise `/` with missing credentials and transient failures, and `/demo` without any external service. Inspect mobile widths, keyboard navigation and the historical-snapshot message.
5. Obtain user approval before publishing any reachable deployment. After approved deployment, verify real host behavior and record the actual URL/results. Never insert a fake deployment badge or URL in README.

Current product remains WAIT. Independent equity evidence, dated multiplier applicability, authoritative security status and execution evidence remain open product limitations even if a host can run the app. No wallet execution is authorized by this runbook.
