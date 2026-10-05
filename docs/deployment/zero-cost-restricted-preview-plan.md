# Zero-cost restricted preview — conditional future plan

**NOT DEPLOYED. No hosted resource is authorized by this document.** October 5, 2026.

This preserves the existing Vercel plan. It describes a possible $0 Cloudflare Workers Free + Access Free route, subject to the [feasibility gates](zero-cost-hosting-feasibility.md). It is **not currently executable approval**: the supported dependency update, Cloudflare mode guard, runtime/CPU evidence and owner acceptance of Free-plan payment-details onboarding must be resolved first. Do not use the old local-only adapter pair as an upload candidate.

## Preconditions before asking to create resources

- Approve a separate small local migration/rehearsal: supported patched Next.js/OpenNext pair; host entry rejects any binding other than `AFTERCLOSE_PREVIEW_MODE=synthetic` before Next runs; missing/invalid-binding workerd tests; no change to engine or local-live semantics.
- Repeat tests, lint, TypeScript, production build, workerd route/RSC/adversarial tests and fetch counters. Measure bundle/startup behavior and CPU with official profiling; do not infer CPU from wall time. If the 10 ms free CPU budget is not defensible, stop rather than buy Workers Paid or redesign the app under this approval.
- Owner must review official Free eligibility/terms and the documented requirement to enter payment details directly with Cloudflare. No card details or credentials are requested through chat. No paid plan, trial, R2, Images or other metered add-on is permitted.
- Confirm the precise owner email and dedicated account scope at a future approval checkpoint. Do not affect unrelated projects/accounts, including Noctive.

## Exact proposed sequence — every step unperformed

1. **Account resource:** only after explicit approval, owner creates/selects a dedicated Cloudflare Free account and Zero Trust Free organization. Accept only a displayed $0 plan and eligible seat allowance. If onboarding asks for a paid subscription or unacceptable payment arrangement, stop. Do not create a Worker yet.
2. **Access first:** in that dedicated account, configure the documented account-wide Workers Access default for **new and existing Workers, both production and previews**. Allow only the exact verified owner email using email OTP (or the approved existing IdP). No Everyone, domain-wide allow, Bypass, service token or public exemption.
3. **Verify saved protection before app upload:** inspect the saved account default and policy scope. Confirm new Workers inherit it. Create the dedicated Worker with provider and preview routes disabled, no custom domain, no DNS route, no tunnel, no cron. Inspect its inherited owner-only policy. Do not upload AfterClose until the protection scope is confirmed.
4. **Safe configuration:** use a fresh sanitized export of the approved future commit, never this developer directory. Configure the safe build/runtime values below. Explicitly inspect binding names for absence of provider credentials and remote storage/services. Exclude `.env.local`, `.env*` from the original checkout, captures, `.tools`, tests, `.git`, `.next` caches and logs. Generate any required safe build environment file from the allowlist only.
5. **Upload synthetic build:** manually upload the supported, validated build with routes still disabled and Access attached. No Git auto-deployment, migration wizard, automatic resource provisioning or deploy hook. Keep preview URLs disabled unless separately needed and protected. Only after checking the saved Worker-level policy, enable its one protected `workers.dev` deployment URL. No actual hostname is invented here.
6. **Unauthorized tests first:** without cookies/tokens/bypass headers, test `/`, `/demo`, scenario queries, JS/CSS assets, RSC, unknown routes and `/api/live`. Test GET, HEAD and OPTIONS on every enabled production/version/preview alias. Require the Access gate, never application HTML/RSC/static content. A signed-in unapproved email must also be denied. Stop and disable routes immediately on any failure.
7. **Authenticate as owner:** use the configured login; verify the returned session belongs to the approved identity and that login is required in a fresh browser session. Never substitute a query-secret link for authentication.
8. **Dashboard:** verify prominent `SYNTHETIC DEMO — NOT LIVE MARKET DATA`, fictional company/providers, frozen clock and unchanged WAIT explanation. Refresh repeatedly; inspect only same-origin app requests. Verify metadata and loading/error behavior.
9. **All scenarios:** exercise all 12 lab scenarios, fallback, unknown routes, RSC refresh, malformed scenario values, mode query/header/cookie attacks and direct route probes. The existing rules alone determine `PROCEED_TO_REVIEW`; no execution or profitability claim.
10. **Logs and resource limits:** inspect hosted app outbound telemetry/counters for **0 live provider fetches** and no Binance/Ondo/equity/wallet/transaction endpoints. Access's identity/OTP infrastructure is separate from app market-data transport. Inspect CPU/startup/errors against Free limits. Absence of ordinary console messages alone is not a sufficient fetch audit; the future upload candidate must provide bounded outbound instrumentation or equivalent host telemetry. Do not log authorization headers, cookies or credential values.
11. **Secrets:** inspect environment/binding names, generated browser assets, HTML/RSC and sanitized logs. No provider/wallet secrets or captured real observations may appear. Confirm omission of the synthetic flag returns unavailable/503 before provider invocation in the locally validated Worker guard; do not experiment with live credentials on the host.
12. **Keep restricted:** retain owner-only Access, production-and-preview coverage and disabled extra routes. Record the actual URL inventory and verification evidence privately. If any gate fails, disable all routes, remove the failed version/deployment and keep Access enabled; do not weaken access or upgrade to paid services.
13. **STOP before judges:** do not add judges or share access-bearing links. Obtain a separate approval listing judge emails, time window and available Free seats; later removal must revoke policy/session access, not merely free a seat.

## Protection-before-first-upload limitation and fallback

Cloudflare documents account-wide default protection for newly created Workers, so this is the preferred ordering. It has not been verified in the owner's account. If that option is unavailable or cannot be saved before Worker creation, **do not upload AfterClose**. With separate explicit approval, the safest fallback is a content-free always-deny placeholder Worker, `workers_dev=false`, `preview_urls=false`, no routes, domains or bindings; attach owner-only Access before enabling any URL, verify the placeholder remains gated, then replace it with the synthetic app. If protection cannot cover every entry point, stop. No brief public AfterClose deployment is allowed for setup.

## Safe future configuration (proposal, not installed)

| Setting | Safe value |
| --- | --- |
| Framework build | Node 24.x; `npm ci`; supported OpenNext local build using pinned approved dependencies |
| Worker entry | Supported adapter output with the separately approved fail-closed host entry check |
| Assets | `.open-next/assets`, binding `ASSETS` |
| Compatibility date | `2026-10-05`, recheck at implementation time |
| Node compatibility | Current date enables it by default; explicit `nodejs_compat` is redundant but was included in the local experiment |
| `AFTERCLOSE_PREVIEW_MODE` | `synthetic`, required at build AND Worker runtime |
| `NEXT_TELEMETRY_DISABLED` | `1`, build-only |
| `NODE_ENV` | `production`, framework-managed build/runtime semantics |
| `workers_dev` | `false` until Access is verified; enable only the protected deployment route afterward |
| `preview_urls` | `false`; separately verify Access before any future enablement |
| Access | Exact-owner-email Allow; all other users denied; production and previews; no bypass |

No database, R2/KV/D1, image optimization, tunnel, custom domain or persistent filesystem is required. No app-level auth secret is required when platform Access is the gate. Platform administration login is not an app binding.

Explicitly excluded: `BINANCE_API_KEY`, `BINANCE_SECRET_KEY`, `BINANCE_WEB3_BASE_URL`, equity/Ondo API credentials, wallet private keys/seed/signing credentials, transaction/RPC secrets, local env files, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_API_KEY`, `CLOUDFLARE_OAUTH_TOKEN`, local CA material and rehearsal preloads. Management credentials must never be embedded in application output. Legacy `NEXT_PUBLIC_BSC_CHAIN_ID` is not required.

## Shutdown

Keep Access enabled, disable deployment AND preview routes, revoke any approved reviewer sessions/policy entries, remove this dedicated deployment/project if authorized, and verify every recorded URL no longer serves AfterClose. Do not roll back to a live-capable unguarded host build. No resource removal or future judge grant is authorized by the present feasibility task.

**NOT DEPLOYED. Stop here; wait for explicit owner approval before creating any hosted resource.**
