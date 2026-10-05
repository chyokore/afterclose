# Static synthetic judging preview — feasibility and local build

**DEPLOYMENT STATUS: NOT DEPLOYED**

October 5, 2026. Static preview feasible: **YES**. Built locally: **YES**. New branch `codex/static-synthetic-preview`, exact base `0b00ab64de53afff7de2dd1911c976a39610f91e`. The full application, its canonical engine/fixtures and its existing Cloudflare/Vercel configurations remain intact. Main and the three preserved preview/feasibility branches were not modified or merged.

## Architecture and incompatibility audit

| Existing functionality | Full application | Separate static target |
| --- | --- | --- |
| Server Components | Next App Router home, layout and lab render on the server | Plain HTML shell and browser TypeScript UI; no React server payload |
| Dynamic rendering | Home/layout explicitly use `force-dynamic` | No dynamic server rendering |
| Runtime environment | Server-only `previewMode()` reads hosting/mode variables | No mode switch or environment reads; only synthetic fixtures imported |
| Server-only imports | Preview guard, evidence loader, Binance and Ondo adapters | Excluded by a build-time dependency allowlist |
| Request-dependent lab | Async `searchParams` selects the scenario | Allowlisted `#/lab/<scenario>` fragment, parsed in the browser |
| Headers/cookies | No application `headers()`/`cookies()` selection found | Not used; cannot configure a live mode |
| Route handlers/server actions | None in the audited app | Zero; no Functions or Worker entry |
| Navigation/refresh | Next Link and `router.refresh()` can request RSC | Native hash links/select; browser refresh reloads static files |
| External APIs | Live-capable full app has provider adapters | No provider adapters, fetch, XHR, wallet or signing code |
| Engine | Pure `evaluateReferenceTruth`, schema validation via Zod | Same source imports, same fixtures, same frozen clock and default policy |

Blindly adding `output: export` to the full app would conflict with forced dynamic layout/home, server mode checks and request-dependent scenario rendering. None of those errors was suppressed; Next configuration is unchanged. The solution is a separate, small browser target rather than a conversion of the live-capable application.

`static-preview/model.ts` imports the canonical engine and fixtures directly. `app.ts` renders the landing workflow and lab, and never substitutes a decision table for engine execution. Even the landing example evaluates the real stale-reference fixture. Evidence tables show price versus observation clocks, provenance and missing references. Cards show multiplier validity/observation, fictional session, liquidity, quote/slippage/expiry, order quantity and disabled execution. Blocking/caution messages come directly from the engine. All twelve fixtures remain unchanged.

A prominent sticky **SYNTHETIC DEMONSTRATION — NOT LIVE MARKET DATA** banner accompanies the experience, including missing-scenario and caught-error states. The standalone HTTP 404 also carries the label. No historical market observations or live-provider source modules enter the browser graph. The UI adds no action/recommendation controls. The canonical fixture contains an illustrative order-direction field internally; it is not offered as a user trading action.

The preview removes only the hosted Next/OpenNext runtime, live adapters, server mode gate, RSC transport and server refresh dependency. It does not remove them from the full application. Local live development remains unchanged.

## Local build and review

Use Node 24.x and the committed lockfile. The only new root development dependency is `esbuild@0.28.2`, pinned explicitly at the version already installed with the tooling. The package lock records its required optional platform entries; no framework/engine upgrade was made. Browser QA uses isolated ignored `playwright@1.63.0` and installed Microsoft Edge; it is not shipped with the preview.

```powershell
npm ci --ignore-scripts --no-audit --no-fund
node scripts/rehearse-static.mjs build
node --import tsx --test static-preview/model.test.ts
node --test static-preview/output.test.mjs
node scripts/serve-static-preview.mjs
```

The last command serves static files only on `http://127.0.0.1:3190`; stop it with Ctrl+C. Open `/#/lab/stale-reference` for WAIT or `/#/lab/fresh-evidence` for review eligibility. The local file server is a development tool, not part of the output or a production server requirement. Browser modules should be served over loopback HTTP rather than opened via `file://`.

To reproduce instrumented browser QA after installing Edge:

```powershell
npm install --prefix .tools/static-browser-qa --save-exact playwright@1.63.0 --ignore-scripts --no-audit --no-fund
node scripts/rehearse-static.mjs browser
```

The sanitized rehearsal launcher inherits only OS essentials, executable PATH and a telemetry-off flag. It passes no provider, wallet, transaction or hosting credentials. It never loads dotenv. The build itself reads only explicit source inputs; it does not copy `.env.local` or use environment substitutions. `npm run build:static` is also available for ordinary local builds.

## Static-output proof

The output directory is `static-preview/dist`. Its exact allowlisted contents are:

- `index.html`: static shell and synthetic/loading/no-JavaScript notices.
- `assets/preview.js`: bundled browser UI, original engine, schemas and fixtures.
- `assets/preview.css`: local stylesheet; system fonts only.
- `404.html`: self-contained labeled missing-page response, no scripts.
- `_headers`: optional Cloudflare static security headers, not executable code.
- `.nojekyll`: empty GitHub Pages compatibility marker.

**Six files, 488,751 bytes total (about 477.3 KiB); zero server functions, API routes, Worker entrypoints, bindings or server environment variables.** There is no `_worker.js`, `/functions`, `.next`, `.open-next`, source map, runtime deployment configuration or provider credential in this directory. The esbuild metafile allowlist contains exactly 100 browser-safe input modules. Tests reject unexpected files, server/provider capabilities and the historical captured observation marker. Size and SHA-256 inventory are recorded in the local `.tools/static-preview/output-manifest.json` and committed `docs/qa/static-preview/results.json`.

The HTML CSP disables connections (`connect-src 'none'`), remote scripts/fonts and forms; all scripts/styles are local. Pages may apply the additional `_headers` directives. GitHub Pages ignores that host-specific file, so the HTML CSP remains useful there. CSP is defense in depth, not authentication. No analytics, telemetry script, third-party font, CDN import or service worker is added.

Hash routes work at the host root and under a repository prefix; no rewrite/function is needed. Unknown hashes show no substitute decision. Unknown HTTP paths can serve the supplied 404; it directs visitors back to their original preview URL rather than guessing a deployment-specific hostname.

## Validation and QA

- Canonical application tests: **88 passed, zero failed/skipped**.
- Static model tests: **15 passed**, including **12 complete-result parity cases** against the original engine and explicit canonical decision expectations, plus fixture independence and route validation.
- Static output tests: **4 passed**; exact six-file inventory, capability scan, browser import graph and synthetic/CSP assertions.
- Existing Next 16.3.8 production build and synthetic isolation rehearsal: passed, including all 12 scenarios, adversarial inputs, RSC, assets and invalid-mode failure. This preserves the full application's behavior.
- Lint and TypeScript: passed.

Browser tests execute the shipped JavaScript in headless Edge, not a mocked result table. At 1440, 390 and 320 pixels, every scenario's decision and ordered finding codes are compared with canonical Node engine evaluation (36 scenario checks). The final run passed all 12 direct scenario reloads, 3 additional refreshes, 45 overflow checks, 8 keyboard checks, 6 missing-route checks, one induced error, and 3 project-prefix checks. It observed 69 local document/JS/CSS requests, **zero external requests, zero API attempts and zero page errors**. The suite also checks mobile selects, skip-link activation, table keyboard scrolling, root/project-prefix hosting, missing routes and a deliberately induced fixture exception. The exception must show the labeled error state with no decision. Normal page JavaScript errors must remain zero.

Network instrumentation observes every context request, blocks/counts any off-origin request, and counts forbidden fetch/XHR/WebSocket/EventSource/beacon calls. Only static documents, CSS and JavaScript are allowed. Service workers are blocked in the test context. This establishes zero application/provider egress over the tested flows; it does not describe unrelated browser/OS background traffic or future host authentication traffic. No API calls were attempted, so the browser test is not merely hiding failed calls.

Ten screenshots are stored in `docs/qa/static-preview`: landing, WAIT and PROCEED_TO_REVIEW at each width, plus a scrolled mobile evidence view. Desktop landing/WAIT, small-mobile review and mobile evidence captures were inspected visually. A 320px decision wrap was corrected and the banner made sticky, then the final captures and browser checks were repeated. No page-level horizontal overflow was found. Price tables scroll within their own region; cards and decision/blocker hierarchy remain readable. Keyboard coverage is a focused functional check, not a claim of a full assistive-technology audit.

## Official hosting comparison (researched October 5, 2026)

| Option | $0 and limits | Compute / domain | Access and suitability |
| --- | --- | --- | --- |
| **Cloudflare Pages, static-only Direct Upload** | Free static requests; 500 builds/month, one concurrent build, 20-minute timeout; 20,000 files, 25 MiB/file | No Pages Functions or customer Workers execution for static requests. Free pages.dev URL; custom domain unnecessary. Prebuilt upload does not require a hosted build. | Preferred for this six-file artifact. Managed Access can protect it separately; configure production and preview aliases deliberately. |
| **Cloudflare Workers Static Assets, no script** | Static asset requests/storage free; 20,000 assets on Free, 25 MiB/file. Local prebuild avoids Workers Builds usage; optional Workers Builds Free allows 3,000 build minutes/month, one concurrent build and a 20-minute timeout. | Documentation supports serving assets without invoking Worker code, and 404 with no Worker script. Requires a Workers control-plane project, but no custom fetch handler. workers.dev needs no purchased domain. | Technically viable static alternative. Never reuse the full app's `main` or `run_worker_first` configuration: that would restore runtime execution. Access is separately configured. |
| **GitHub Pages** | GitHub Free supports public source repositories; published site ≤1 GB, soft 100 GB/month bandwidth, soft 10 builds/hour, 10-minute deployment timeout | Static HTML/CSS/JS hosting; no application server functions. Default github.io/project URL; relative assets and hash links were rehearsed. | Technically suitable public fallback for a nontransactional project demo. Native private-site access requires an eligible Enterprise Cloud organization, not ordinary GitHub Free. A private repository alone does not make its Pages site private. |

Sources: [Workers Builds limits](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [Pages static pricing](https://developers.cloudflare.com/pages/functions/pricing/), [Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Workers asset routing](https://developers.cloudflare.com/workers/static-assets/), [asset billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/), [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [GitHub limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [GitHub private access](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/changing-the-visibility-of-your-github-pages-site).

[Cloudflare's Pages product page](https://www.cloudflare.com/products/pages/) advertises free startup and unlimited bandwidth; the detailed platform limits still apply. Its supported product/prototype sharing use case is consistent with this fictional hackathon demo (inference, not account-specific eligibility approval). GitHub permits project sites but prohibits using Pages to operate an online business, commercial transactions or SaaS. This demonstration has none of those capabilities; a future commercial/live product would require a fresh eligibility review. No hackathon-specific hosting exemption is assumed.

## Private review versus final judging

**Pre-submission:** retain local owner review unless separately authorized to set up genuine host authentication. Static files cannot keep a client-side password secret or enforce access by themselves. Cloudflare's managed Access service can authenticate before static delivery without adding an AfterClose Worker/Function; the platform still performs authentication processing. Do not install the Pages Functions Access plugin as a workaround: that would add Functions execution. No client-side password gate or obscure-link privacy claim was introduced.

The [Pages preview toggle](https://developers.cloudflare.com/pages/configuration/preview-deployments/) protects previews only. The [official production-domain procedure](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain) describes separate coverage for the production pages.dev hostname and wildcard previews. Under future authorization, create an empty Direct Upload project, establish exact-owner Allow rules for both scopes, and verify unauthenticated asset/HTML denial before meaningful app exposure. Do not upload the app first to discover protection mechanics. If the actual account cannot establish protection first, stop or use a separately approved content-free placeholder. Account mechanics and all-alias enforcement remain unverified.

Access Free is a separate entitlement/onboarding decision: the [Zero Trust setup documentation](https://developers.cloudflare.com/cloudflare-one/setup/) requires payment details even for Free while stating it will not charge that plan. Check seat allowance, eligible account and owner acceptance before setup. Public static Pages hosting is advertised without a credit card; adding Zero Trust is not the same onboarding path. Native private GitHub Pages would introduce a paid Enterprise requirement. A custom authentication Worker would reintroduce app runtime and is outside this static design.

**Final hackathon submission: UNRESOLVED.** Repository README and `docs/qa/demo-readiness.md` contain project descriptions and our own submission checklist, not organizer rules. No authoritative contest rules, organizer submission page or authenticated judging instructions were found. Whether a public URL, repository, video, supplied credentials or a combination is required remains unresolved. A public static URL is technically possible, but privacy must not be weakened on that assumption. Obtain authoritative requirements and explicit owner publication approval first.

## Recommendation and boundaries

**STATIC PREVIEW READY FOR OWNER REVIEW.** The synthetic product experience fits a six-file client-only artifact and avoids the full Next/OpenNext CPU risk. Prefer Cloudflare Pages static-only if the owner later authorizes hosting, with GitHub Pages as a public fallback where its source/eligibility rules are acceptable. This is readiness for local owner review, not authorization to deploy or remove authentication.

Only the generated static directory should be considered for a future upload after approval. Never upload the repository, `.env.local`, `.tools`, the old Worker configuration or the full `.open-next` output. No deployment command was run, and no hosted account/project/policy/payment/DNS/tunnel/resource was created. No wallet was connected and no transaction was broadcast. Noctive was untouched.

### Final credential scan

The bounded credential-pattern scan covered **110 text files** across Git-visible source/configuration/docs, all six generated static files and local build/browser evidence logs/metafile/manifest. **Zero findings**; **15 binary files skipped** (the existing images and ten new QA screenshots). No source maps are generated. This is a pattern scan rather than proof against every possible unknown secret format. The sanitized build/browser launches supplied no provider, wallet, signing or hosting credentials. Local QA listeners were closed after completion.
