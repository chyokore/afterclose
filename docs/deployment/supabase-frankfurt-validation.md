# Supabase Frankfurt Gate A validation

Status: IN PROGRESS — hosted invocation is awaiting owner approval to disable the default legacy JWT check for the credential-free read-only function. No Gate A PASS is claimed.

## Confirmed account and deployment facts

- Organization: AfterClose (`fqahaejvrdizirhdbuan`); actual dashboard Free plan, one project, usage limited. Billing states no extra usage charges and displays Spend Cap enabled. No payment was requested during creation; no paid upgrade or add-on selected. This observed UI wording differs from the public documentation's description of the named Pro cap.
- Project: `afterclose-frankfurt`, ref `wakuqrnxjwikvlrxgezg`. Owner created the database password privately. Primary database: Central EU (Frankfurt), `eu-central-1`, Nano (`t3.nano`), healthy. Data API disabled. No application tables/migrations created.
- Pre-validation usage: 0 / 5 GB egress; database 26 / 500 MB; storage 0 / 1 GB. The baseline database exists as required infrastructure and is not proof of gateway database writes.
- Exactly one function deployed: `live-evidence` at `https://wakuqrnxjwikvlrxgezg.supabase.co/functions/v1/live-evidence`.
- Credential-free deployed source commit: `9e0e9dec2d1611d9938625ddcab2eaf97ac30802`; source digest `3978ecc3895dd471f5b25f6bb1396d2caccfc623c40cbcc917d88db91433d8f3`; clean build, 504,617 bytes. Deployment made 2026-10-07; precise platform timestamp pending log inspection.
- Supabase secret-name inspection: **no custom secrets**. Platform default names exist; their values were not opened or copied. Binance credential names absent.
- Binance hosted requests: **0**. Provider credentials entered: **0**. Cloudflare and Netlify unchanged; no wallet/signing/transaction simulation/broadcast.

## Adapter and boundaries

`gateway/supabase-validation.ts` is intentionally Gate A only. It always returns canonical unavailable evidence, even if credentials were accidentally configured. The entry point also restricts global fetch to the two fixed geolocation URLs, with redirects rejected. No environment values are included in diagnostics beyond the explicitly approved runtime-region identifier. Unexpected region values are normalized to `unverified`.

Runtime must report `SB_REGION=eu-central-1` before any provider or diagnostic work. Missing/other region returns `HOST_REGION_UNVERIFIED`. Exact CORS origin is `https://afterclose-preview.pages.dev`; GET only; fixed function path; only one exact `forceFunctionRegion=eu-central-1` parameter permitted. Arbitrary asset, chain, contract, URL and endpoint parameters are rejected. Per-instance 120/minute limit retained; this is not a global abuse quota.

Temporary `/diagnostics` performs at most two outbound requests per instance and coalesces repeat calls. It has a two-hour build-time expiry; it must be disabled in the retained final deployment after measurement. Targets are [IPWhois](https://ipwhois.io/documentation) (`https://ipwho.is/`) and [ipapi](https://ipapi.co/api/) (`https://ipapi.co/json/`). No secrets or request headers from callers are forwarded. Diagnostics are labelled runtime validation, not market evidence.

Build: `node --conditions=react-server --import tsx scripts/build-gateway-supabase.ts --diagnostics`. Output resides in ignored `.tools/supabase-validation`; no environment-file load, source maps, React/Next or Scenario Lab. Fixed synthetic engine test vectors are embedded solely for temporary compatibility checks; no simulated trade is executed.

## Local validation

75 targeted tests passed (canonical engine, competition receipt and adapter controls). Five adapter tests passed again after TypeScript-only corrections. TypeScript check passed after fixing build/test typing and pre-existing benchmark typing. Lint passed before those small corrections; final lint result pending.

Canonical engine, normalization and Evidence Receipt source are unchanged. Local unavailable receipt and digest equal the adapter response. Hosted tests will compare fixed WAIT/MONITOR/PROCEED_TO_REVIEW/provider-unavailable engine outputs and two canonical unavailable receipts byte-for-byte with local results. The current live Evidence Receipt cannot legitimately produce MONITOR or PROCEED_TO_REVIEW without independent evidence; synthetic engine outcomes must never be relabelled as live receipts to satisfy that test wording.

Known credential exact-value scan: zero findings in source and bundle. General pattern scan flags only the pre-existing dummy benchmark key in `scripts/benchmark-gateway-cpu.ts`, not an actual credential and not a bundle input. Supabase key-pattern/public-response/log scans remain pending hosted validation.

## Geography and outstanding evidence

| Layer | Current evidence |
|---|---|
| Project region | Frankfurt `eu-central-1`, confirmed dashboard |
| Invocation region | Intended regional parameter; not invoked yet |
| Runtime region | Guard implemented; hosted value pending |
| Public egress IP/country/city/ASN | Pending two-source diagnostic |
| Classification | UNKNOWN pending measurement; not permission for credentials |

[Supabase regional invocation](https://supabase.com/docs/guides/functions/regional-invocation) documents runtime metadata and per-request routing. Project location alone does not establish egress. Geolocation samples are observational and imperfect, not a guarantee for future dynamic instances or Binance acceptance.

Current [Binance restrictions](https://web3.binance.com/en/dev-docs/web3-api-prohibited-regions) omit Germany. Observed country is not yet available, so the comparison is pending. “Not listed” is not guaranteed access; historical `40304` remains unexplained.

Hosted runtime compatibility, first/warm/diagnostic latency, receipt equality, CORS, input controls, logs, post-validation quotas and payment state remain pending. No authenticated test bypass using Supabase keys is planned.

## Inactivity and judging risk

[Supabase Free pausing](https://supabase.com/docs/guides/platform/free-project-pausing) evaluates low database activity over seven days. Owner receives warning/confirmation emails and resumes through the dashboard. Gateway traffic is not guaranteed to prevent project pausing, and an automatically restored function cannot be assumed. Treat a paused project as unavailable to judges until resumed and checked. No artificial keepalive, background job or paid upgrade was added.

Gate B is separate: even successful observed non-US egress requires explicit owner authorization before any Binance secret entry. The Gate A adapter deliberately cannot become live merely by adding secrets.
