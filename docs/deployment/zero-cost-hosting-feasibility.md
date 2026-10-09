> Historical AfterClose milestone/runbook. Current release: [Cloudflare + Supabase](public-live-release.md); current judge path: [proof index](../submission/proof-index.md). Historical commands are not authorization to deploy or alter accounts.

# Zero-cost restricted hosting feasibility

Date: October 5, 2026. **NOT DEPLOYED.** Baseline: `eac2f459fc6c9e582a65dfe0b1fa26f0e9960cdf`, branch `codex/restricted-synthetic-preview`, confirmed clean before work. Feasibility work is isolated on `codex/zero-cost-hosting-feasibility`. The existing Vercel documents, app source, engine, dependency manifest and lockfile are preserved.

## Decision and evidence categories

**Classification: B — Small migration.** The rendering features fit Cloudflare's documented adapter model, but a safe current deployment needs a Next.js patch/dependency update and a small Cloudflare-specific fail-closed entry check. Neither migration is performed in this task. This is not a claim that the current commit is ready to upload.

**Recommendation: CONDITIONAL GO for further local compatibility work, NOT authorization to host.** Workers Free plus Access Free is a documented $0 topology, not yet a proven $0 deployment of this exact app. Payment details are required by current Zero Trust onboarding documentation, even when no charge is due. CPU budget and final patched-adapter runtime compatibility remain acceptance gates. If the owner will not provide payment details to Cloudflare directly, this proposed onboarding route is blocked; no details have been requested.

Evidence notation: **D** documented fact from linked official sources; **L** local observation; **I** inference/assumption; **U** unresolved. No account, billing screen or remote protection setting was inspected.

## Approval matrix

| Requirement | Cloudflare | Alternative if needed |
| --- | --- | --- |
| $0 eligible | D: Workers Free and Zero Trust Free exist. I: small non-critical research preview fits intended hobby/PoC use. U: actual account acceptance and CPU fit. | Not investigated: alternative survey is requested only for C/D. Existing Vercel plan remains intact. |
| Next.js compatibility | D: App Router/RSC/SSR supported; L: baseline built and ran with adapter 1.20.7. Latest adapter excludes 16.3.6. | — |
| Migration category | **B**, small dependency update and fail-closed hosting entry check; no engine rewrite. | — |
| Real access control | D: Cloudflare Access attached to Worker, production AND previews; exact owner email Allow, everyone else denied. | — |
| Custom domain required | D: No; Access can protect provider `workers.dev` URLs. | — |
| Payment method required | D: Yes in documented Zero Trust onboarding, including Free; no subscription charge for Free. | — |
| Synthetic-only compatible | L: existing Node path enforces synthetic mode; U: final supported Workers bundle acceptance. | — |
| Server secrets required | No market/wallet secrets. Hosting administration authentication is separate from app bindings. | — |
| Judge access possible later | D: add approved exact judge emails to Access; subject to available free seats. No grant made. | — |
| Deployment risk | U: 10 ms CPU/request; patch/adapter compatibility; operator mode misconfiguration; all URL/asset protection must be checked. | — |
| Recommended | Conditional only; no current deployment GO. | Existing Vercel strategy is neither replaced nor edited. |

## Actual application requirements (L)

- Next.js **16.3.6**, React/React DOM **19.2.8**; Node **24.x** declared for development/build/Node hosting.
- App Router has `/` and `/demo`; server components render both, with root layout and `generateMetadata`. No API route handlers, server actions, middleware/proxy, wallet or transaction integration.
- `/` and root layout declare `force-dynamic`; `/` selects Node runtime. Lab reads asynchronous request `searchParams`. Refresh is `router.refresh()` and fetches a fresh RSC response; it does not fetch a provider directly.
- `server-only` protects preview mode, dashboard loader, Binance client/wrappers and Ondo reader. Live code imports `node:crypto` (`createHmac`, `randomUUID`) even though synthetic execution never invokes live providers.
- No application filesystem reads/writes, database, persistent disk or background jobs at runtime. Build and test scripts use filesystem/child processes locally. Next's generated framework output requires an adapter for Workers; Node's `next start` is not itself a Worker entrypoint.
- Two live transport sites use `fetch`: signed Binance reads and Ondo HTML retrieval. Both have adapter guards. Equity adapter is unavailable-only; calendar/engine are pure. Synthetic mode needs no outbound provider network or provider credential. No remote font/image/analytics import exists in app source.
- Server environment: `AFTERCLOSE_PREVIEW_MODE`; local-live credentials `BINANCE_API_KEY`, `BINANCE_SECRET_KEY`, optional pinned `BINANCE_WEB3_BASE_URL`; Vercel markers are used only to reject missing mode there. No public application environment variables are required.
- Output is a `.next` Node/server/RSC build with browser JS/CSS. Dashboard/lab/404 render dynamically. Captured data in tests/docs/ignored tools is not public content or a synthetic fixture input.

A. **Static export: not as-is.** Request-time mode validation, forced dynamic rendering, query-selected server scenarios and RSC refresh require a server. A static redesign would change behavior and is outside scope.

B. **Current Cloudflare support: feature-compatible in documentation, exact package compatibility needs attention.** Cloudflare now recommends vinext for new Next.js applications. This task does not replace Next's renderer/build system with vinext; doing so would expand migration risk.

C. **Workers adapter: OpenNext is the documented existing-app route investigated.** It transforms Next build output to `.open-next/worker.js` and `.open-next/assets`. Wrangler supplies local workerd emulation. No R2/KV/D1/Images/service binding is needed by these uncached dynamic fictional pages.

D. **Significant rewrite: no evidence it is necessary.** Do not rewrite routing, engine, prices, issuer validity, calendar semantics or decisions to make hosting easier.

## Dependency and runtime compatibility

Public npm metadata read locally:

| Package | Exact version/range |
| --- | --- |
| Current `@opennextjs/cloudflare` | `1.20.8`; Next peer `>=15.5.27 <16 || >=16.3.8`; Wrangler `^4.125.0` |
| Baseline-compatible local-only adapter | `1.20.7`; Next peer `>=15.5.26 <16 || >=16.3.6` |
| Wrangler inspected | `4.147.0`; Node `>=22.0.0` |

The [maintainer guide](https://opennext.js.org/cloudflare) broadly lists Next 16 support and warns that Windows is not fully supported. Exact package peers are more specific than that broad statement. [Next 16.3.8 release notes](https://github.com/vercel/next.js/releases/tag/v16.3.8) document security fixes. We do not force peer resolution or recommend the older pair for hosting. A future isolated update should align Next, `@next/env`, ESLint Next config and supported adapter, then rerun everything. Feature-specific advisory applicability has not been exhaustively audited.

The local-only experiment installs the compatible prior adapter in `.tools/cloudflare-feasibility`, not the repository's dependency tree. Its manifest/lockfile are disposable experiment artifacts; root dependencies remain exact. The experiment does not constitute the prohibited B migration.

[Cloudflare OpenNext instructions](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) require Node compatibility with a date at least 2024-09-23. Current [compatibility documentation](https://developers.cloudflare.com/workers/configuration/compatibility-flags/) makes Node compatibility default for dates >=2026-08-04. Rehearsal explicitly uses date `2026-10-05` and `nodejs_compat`; the redundant flag may produce a warning. `process.env` binding population is available with the current date. Unsupported Node stubs exist, but AfterClose's application path uses crypto, not child processes/worker threads at runtime.

**Configuration gap:** `previewMode()` deliberately treats an unset mode outside Vercel as local live mode. Cloudflare has no Vercel marker. Therefore a future Cloudflare entrypoint must reject absent/non-`synthetic` binding BEFORE calling the Next worker, and build tooling must require the same flag. Do not rely on a missing Binance key: Ondo has no key requirement. Do not weaken the existing guards or change the local-live default during this feasibility task. Browser queries/headers are not server bindings.

## Cost, eligibility and limits (D unless marked)

[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) provides a Free tier with 100,000 dynamic requests/day, 10 ms CPU/invocation and no duration charge. Static-asset requests are free/unlimited; worker-first dynamic handling still consumes worker quota. No paid add-ons, storage or Images are proposed. Free quota exhaustion must mean reduced availability, not an automatic upgrade.

[Current limits](https://developers.cloudflare.com/workers/platform/limits/): 128 MB memory, one-second startup, 64 MiB **uncompressed** Worker bundle, 100 Workers/account; 20,000 static files/version, each <=25 MiB. The official September update supersedes the older 3 MiB compressed Free limit still present in OpenNext's guide. Local success cannot establish Cloudflare's deployed CPU/startup accounting. SSR may exceed 10 ms: this remains a blocking acceptance measurement, not a promise that low visitor count solves it.

[Workers Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/): Free 3,000 build minutes/month, one concurrent build, 20-minute timeout, 2 vCPU/8 GB RAM/20 GB disk. Deploy hooks allow 10/min/Worker and 100/min/account; these are hook limits, not a universal number of deployments. Manual local build/upload avoids hosted build minutes. No CI/Git build connection or hook is proposed or created. General account/API limits still apply; no unlimited-deployment claim.

[workers.dev intended use](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) is personal/hobby, non-business-critical workloads. [Cloudflare's Zero Trust plans](https://www.cloudflare.com/plans/zero-trust-services/) explicitly invite free proof-of-concept use. I: an owner/judge-only fictional hackathon demonstration appears consistent with those descriptions. This is not an account-specific eligibility determination or a guarantee that an eventual commercial launch qualifies. [Service terms](https://www.cloudflare.com/service-specific-terms-application-services/) and the applicable account terms continue to apply.

## Access control (D; none configured)

Cloudflare's [Worker Access update](https://developers.cloudflare.com/changelog/post/2026-08-14-workers-access/) documents Worker-attached policies across domains/preview URLs and account-wide protection for new and existing Workers. Protect **both production and previews**, not previews alone. In a dedicated account, the account-wide default can be saved before creating/uploading AfterClose. Never change shared unrelated infrastructure.

Owner-only proposed policy: Allow exactly the owner's verified email, no whole-email-domain grant, Everyone rule, Bypass rule or service token. Use [email one-time PIN](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/) or an existing supported identity provider. [Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/) deny unmatched users by default. Later judges can be added by exact email only after separate approval; OTP means they need an accessible mailbox, not a wallet or app credential.

Cloudflare's [official small-business guide](https://cf-assets.www.cloudflare.com/slt3lc6tev37/7oEleWnoR1ggS7GfMUb3oO/bc05cd36279b0e4bc5fcc942f2a3264e/Cloudflare-security-guide-for-small-and-medium-enterprises.pdf) describes Free protection for up to 50 users. Seats are account-wide; [seat management](https://developers.cloudflare.com/cloudflare-one/team-and-resources/users/seat-management/) explains that authenticated users consume seats. Confirm remaining Free allowance before any judge grant. No user count or entitlement was inspected in an account.

[Zero Trust setup](https://developers.cloudflare.com/cloudflare-one/setup/) currently says payment details are required even on Free, with no charge for that plan. Thus **$0 is not the same as no payment method**. Do not start a trial, add a paid plan or collect card details here.

Provider-domain protection means no custom domain/DNS purchase is necessary. Platform Access should gate all app paths/RSC/endpoints/assets on every reachable URL. Actual all-path protection, bypass behavior and revocation remain hosted checks; noindex/hidden URLs and mocked local identities would not prove them.

## Local rehearsal evidence

Locally verified: 86 tests pass; ESLint and TypeScript pass; standard production build passes; Node request/adversarial/refresh checks record 0 provider fetches. OpenNext 1.20.7 built unchanged Next 16.3.6 successfully, and workerd passed 52 HTML/RSC cases, metadata and 11 static assets with 0 application external fetch attempts. Generated output: 1,140 files / 22,454,795 bytes, not a final Worker bundle measurement. Windows, developer-metadata TLS fallback and recovered ProxyWorker connection warnings were observed. No hosted CPU or Access result is implied. Final details, attempted commands and limitations are recorded in [the diary](../devex/zero-cost-hosting.md). Package downloads are tooling traffic, not app provider requests. External-provider counters refer only to instrumented app build/runtime tests, not npm's public registry traffic.

No Cloudflare login, `deploy` command (including dry-run), migration wizard, account/project/domain/tunnel/token/access-policy creation or purchase is authorized or performed. No B/C application migration is performed. Source-control push is the only authorized remote write.
