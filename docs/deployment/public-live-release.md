# Cloudflare public live integration — release record

Prompt 28, October 9, 2026. Branch `codex/cloudflare-live-integration`, exact base `e4ffdb891b13558e257420441223f2bf4a2ba24d`. Release validation is in progress; deployment results will be appended after observed staging and production checks. No main merge.

## Scope and rollback

Cloudflare project `afterclose-preview` stays static. Supabase project `wakuqrnxjwikvlrxgezg` stays in Frankfurt. Existing authentication and secrets are unchanged. The canonical engine and receipt files are unchanged. Netlify is untouched.

Before promotion, preserve synthetic-only production deployment `0bd20e4d-c861-4ee0-898f-ea43c579fc44` / source `538b119`, immutable URL https://0bd20e4d.afterclose-preview.pages.dev and frozen local artifact `.tools/pages-release/dist`. Existing production branch is `codex/static-synthetic-preview`. Use Cloudflare deployment rollback to that deployment, or redeploy the preserved artifact to that existing production branch. Do not rebuild rollback from the new source.

Staging uses https://live-staging.afterclose-preview.pages.dev on the same project. Gateway CORS accepts only that exact origin and https://afterclose-preview.pages.dev; arbitrary preview aliases remain denied. Region selection remains `forceFunctionRegion=eu-central-1` and runtime region is independently checked before provider work. No authorization header or key is needed from the public browser; Supabase JWT verification was already disabled under prior owner authorization and is not changed here.

## Frontend safeguards

One explicit refresh, one in-flight promise; 30-second network timeout, 45-second tab-session persisted cooldown, minimum 60 seconds after failure, Retry-After seconds/date support. No retries, polling, navigation/remount requests, custom auth headers or client API secrets. Local interval only updates the elapsed clock/button. Session controls are not global quota enforcement; Supabase limits/cache remain per isolate. Unavailable or invalid receipts clear live values and never substitute fixtures.

Scenario Lab keeps the original generated JavaScript unchanged, frozen synthetic inputs and `connect-src 'none'`. Only navigation and explicit labeling change. Browser hash verification does not claim engine reproduction; the existing offline verifier performs it.

## Predeployment checks

- Full TypeScript test suite: 171 passed, zero failed.
- TypeScript and ESLint: passed.
- Isolated static frontend build: passed, two allowed browser source modules, no source maps.
- Local mobile Scenario Lab: all 12 rendered, expected WAIT/MONITOR/PROCEED_TO_REVIEW, no page overflow at 390 px.
- Further staging/production evidence: pending below.

## Cost boundary

Existing free Cloudflare Pages project and Supabase Free project only. No payment method, paid service, overage setting, wallet, simulation, transaction signature or broadcast is introduced. Final dashboard checks and actual request accounting will be recorded after validation; display counters can lag.
