# Owner checklist: conditional Supabase Frankfurt validation

This is a future plan, not deployment authorization or a runnable finished port. Prompt 24 executed none of these account/deployment actions. See [decision and sources](non-us-hosting-matrix.md). Primary: Supabase Free. Fallback: Vercel Hobby `fra1`, only after separate plan-eligibility and egress checks.

## Before any deployment or secret entry

1. Obtain a new, scoped owner authorization for controlled validation. Use a Free organization with an available free-project slot. Confirm current signup needs no payment method; if it demands a card, trial subscription, paid networking or add-on, stop. Capture plan/allowances without personal or secret information. Do not reuse a paid organization, since billing is organization-wide.
2. Proposed service: one Supabase Edge Function named `live-evidence`; project region Frankfurt `eu-central-1`. Database-region selection alone does not pin functions. The included database is unused by the gateway; do not add application tables, wallets, storage or background jobs.
3. Confirm with official provider evidence/support that direct outbound HTTPS from an invocation in `eu-central-1` retains German egress, including subsequent dynamic instances. Current public docs prove routing and dynamic IPs, not that guarantee. If this cannot be established, stop before Binance credentials or calls; an IP geolocation sample alone is not a durable guarantee.
4. Review Binance account eligibility and whether the key requires static IP allowlisting, without showing key values. If paid/static networking is required, reject this candidate. Do not disable account protections or route around geography restrictions.

## Small adapter to implement in the next authorized milestone

- Runtime: hosted Supabase Deno Edge Runtime with Node built-in/npm compatibility. No Next/React runtime. Proposed entry point: `supabase/functions/live-evidence/index.ts` using `Deno.serve` and the existing gateway handler. These files do not yet exist.
- Proposed build command: `node scripts/build-gateway-supabase.mjs` (script must be implemented and reviewed first). Base it on the existing isolated `scripts/build-gateway.mjs`: bundle only gateway dependencies to ESM, retain build/source identity, exclude environment files and client/Next/React imports, no source maps. Choose a Deno-compatible JS target and preserve external `node:` imports. Do not deploy the Netlify-specific wrapper or blindly reuse its Node24 target. Supabase CLI then packages the prepared function; no ordinary Next build.
- Validate `node:crypto`, `node:async_hooks`, Buffer, process/env, fetch streams, Zod and conditional `server-only` resolution in the actual Edge Runtime. Map only required variables via `Deno.env.get` if needed. Never dump the environment. Failure requiring changes to canonical logic is a stop condition.
- Before invoking the gateway or starting ANY provider fetch, require platform `SB_REGION === "eu-central-1"`; missing/other region returns unavailable without provider I/O. Do not accept a caller-supplied header as this proof. No cross-region fallback.
- Future browser endpoint: `https://<project-ref>.supabase.co/functions/v1/live-evidence?forceFunctionRegion=eu-central-1`. Strictly validate the external path and this one exact parameter, reject duplicates/extra parameters, then normalize to existing `/api/live-evidence`. Preserve method, Origin and rejected-header checks. Do not strip arbitrary queries. Runtime guard remains mandatory even when query routing is supplied.
- Use public read-only function invocation (`verify_jwt = false`) only after reviewing that configuration. No browser service-role key, API key or Authorization header. Preserve exact CORS origin `https://afterclose-preview.pages.dev`, no wildcard; existing simple GET requires no custom-header preflight.
- Keep the canonical Reference Truth Engine, Evidence Receipt and digest untouched. Test unavailable states, cooldowns, route/method/header rejection and secret redaction. Test missing/wrong runtime region and malicious region query/header inputs with a fetch spy proving zero provider requests.

## Configuration names only

Owner enters `BINANCE_API_KEY` and `BINANCE_SECRET_KEY` in the Supabase production secret dashboard only AFTER egress validation. Do not paste into chat, commands, repository, logs or frontend. The provider's CLI is also supported, but avoid literal command-line secret values.

Nonsecret server settings: `AFTERCLOSE_DEPLOYMENT_MODE=competition-live`, `NODE_ENV=production`. Leave `AFTERCLOSE_PREVIEW_MODE` and `BINANCE_WEB3_BASE_URL` unset to retain validated defaults. `SB_REGION` is platform-supplied; never override it. Existing production CORS is a code constant. No new browser credential setting is required.

## Controlled validation sequence after authorization

1. Deploy only a credential-free package after offline adapter tests pass. Wrong-region instances must reject before provider I/O. Inspect `SB_REGION`, response `x-sb-edge-region`, deployment identity and configuration.
2. From the selected runtime only, use a credential-free diagnostic to corroborate public outbound IP/country with provider routing evidence. Do not contact Binance yet. Repeat on fresh instances; a sample supplements, not replaces, the regional guarantee. Remove the diagnostic before publishing the gateway.
3. Only after all regional/account gates pass may the owner enter secrets privately. Make one read-only genuine Binance observation, respecting cooldowns. Verify provider success without logging auth material; validate returned receipt/digest locally. No retry storm or credential replacement on `40304`; its meaning is still unknown.
4. Test allowed and denied CORS origins, bad paths/query/method/headers, unavailable behavior, receipt determinism, build identity, secret scan and bundle size. Measure cold/warm hosted latency and CPU; no invented hosted estimates. Preserve strict CORS on adapter-generated errors too.
5. Only then authorize a separate frontend endpoint change. Existing Cloudflare Pages remains unchanged throughout this research and until that approval. Never route it to Ohio Netlify.

There is no current separate health endpoint. A future credential-free validation route must not trigger providers; the existing `/api/live-evidence` handler otherwise returns unavailable when unconfigured. Do not treat an HTTP 200 static page as live backend health.

## Limits, judging and rollback

Expected Free allowance: 500,000 function invocations/month and shared 5 GB egress; 256 MB memory, 2 seconds CPU excluding network wait, 150 seconds wall duration. Confirm current account quotas. Free usage is not billed, but restrictions and inactivity pausing can interrupt service. The paid Pro Spend Cap is not part of this plan.

Before and throughout judging, owner checks dashboard status, pause-warning emails and quota headroom, particularly because an unused database may trigger seven-day inactivity pausing despite function traffic. Resume manually if necessary. If uninterrupted unattended judging cannot be supported, stop and reconsider the fallback; do not add paid upgrades or artificial keepalive traffic.

Stop on any payment demand, unknown/prohibited egress, unsupported runtime dependency, engine/receipt change, unexpected provider restriction, leaked credentials, CORS widening, or unacceptable cold starts/pausing. Do not compensate with a proxy, static IP purchase, simulation or alternate credential placement.

Rollback after a future authorized deployment: restore the frontend's previous static/unavailable state, disable the new function, and remove its secrets through owner controls. Never roll back to the US Netlify gateway. Retain sanitized diagnosis only. Current Netlify recommendation: leave inactive temporarily; no modification made by Prompt 24.
