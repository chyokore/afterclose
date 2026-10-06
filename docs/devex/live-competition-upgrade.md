# Live competition upgrade engineering log

Date: October 6, 2026. **AI-assisted factual engineering record, not a submission-ready personal developer experience report.** The owner must write and verify their own report under the [official competition rules](https://www.bnbchain.org/en/hackathons/tokenized-stocks). No human interview, subjective owner experience or onboarding duration is invented here.

## What changed

Base `4801dd9729df5651d01fce157380b56d38dff02b` contains the full app as well as the additive static target. Created `codex/competition-live-evidence`; protected static branch and deployment were left alone. Added `/live`, per-response observation clocks, current identity discovery independent of historical contract selection, deterministic freshness, a SHA-256 receipt/verifier, local historical snapshots and an explicit path back from Scenario Lab. Existing engine thresholds and 12 fixtures remain intact.

## Failures are part of the evidence

| Stage | Established evidence / limitation | Record |
| --- | --- | --- |
| DNS | Initial requests failed with ENOTFOUND/connection timeouts before HTTP; that was not a credential rejection | [Live verification](live-verification.md) |
| Browser VPN → system networking | Browser-only VPN did not establish Node reachability; system network behavior had to be checked separately | [Errors](errors.md), [API observations](api-observations.md) |
| TLS → Windows CA | HTTPS inspection presented AVG Web/Mail Shield Root. Node 24 with `NODE_USE_SYSTEM_CA=1` uses the trusted Windows CA chain; verification stays enabled | [API observations](api-observations.md) |
| Schema mismatch → live success | Real response shapes differed from initial assumptions: nullable asset types, multi-chain search and decimal representation required validation changes | [API observations](api-observations.md), `tests/binance-rwa.test.ts` |
| Provider/issuer/session research | Token-derived reference is not independent stock evidence; undated issuer ratio and published calendar do not establish current applicability or live exchange state | [Underlying research](underlying-equity-research.md), [issuer/session](issuer-multiplier-and-session.md) |
| Execution research | RFQ wallet context and unsigned transaction context missing; no fabricated address or simulation | [Execution research](binance-execution-evidence.md) |
| Hosting CPU → static fallback | Previous full Next/Worker experiment exceeded free CPU assumptions; static fallback removed runtime, not source functionality | [Cloudflare rehearsal](../deployment/cloudflare-migration-rehearsal.md), [deployment record](../deployment/static-preview-deployment-record.md) |
| This upgrade: chain signing bug | Initial added chain-list call was blocked locally by the RWA-only signing helper. Platforms/tokens/search returned 200; no price evaluation or snapshot was accepted. Fixed by admitting only the exact supported/chain path, preserving quote/simulation exclusion | `src/lib/binance/auth.ts`, `tests/auth.test.ts` |
| This upgrade: sandbox runtime | A sandboxed Node invocation failed `uv_os_get_passwd` ENOMEM before requests. Running the authorized local diagnostic outside that process sandbox succeeded | No fabricated provider failure inferred from this local runtime error |
| This upgrade: issuer history | Two diagnostic attempts returned 403; asset page parsed successfully, but effective/validity dates remain absent | [Capture](../competition/live-evidence.md) |

The existing five-endpoint diagnostic first returned five genuine HTTP 200/code 0 responses. The failed chain-extension capture then recorded three successful Binance responses (platforms/tokens/search), but failed closed. After the signing fix, all six endpoints succeeded. Current rediscovery MATCH, 18 decimals, token `241.622303710990170189`, provider clock `2026-10-06T12:45:20.403Z`, observed `12:45:24.721Z`, evaluation `12:45:24.736Z`. This is a historical capture after that instant. At capture it was LIVE token evidence / PARTIAL overall / WAIT.

Ondo reported `1.0017152487959898` again through a fresh page request. The fact that its value equals the older capture does not prove either staleness or dated current validity. The history API's 403 means applicability is unresolved; the engine receives no verified multiplier.

## Actionable developer-platform feedback

- Document exact timestamp-to-field associations for each RWA reference and status. A response timestamp cannot repair a missing price event time.
- Supply dated shares-per-token history with effective boundaries and clear developer entitlement errors; an inaccessible history endpoint prevents defensible per-share normalization.
- Provide canonical cross-chain discovery examples covering nullable asset types and string/numeric decimals, with runnable response fixtures.
- Document Ondo RFQ receiver context, route restrictions, quote lifetime and signature stages together. An unsigned quote request is not evidence of an executable order.
- Include Windows HTTPS-inspection guidance that preserves certificate verification, and distinguish DNS/TLS/authentication/schema failures in starter diagnostics.
- Publish specific public-demo display rights and event-period quotas, especially if independent equity data is offered later. API access alone does not establish redistribution permission.

AI stack used: Codex assisted implementation, official-documentation research, tests and this record; Next.js/TypeScript, Zod and Node crypto implement the application. Binance Agentic Wallet, Wallet Skills, trading CLI and BNB Agent Studio were not used; no firsthand claims about their UX are made. Quote depth/slippage and cross-issuer trading behavior were not measured.

## Validation and external-call accounting

See the completion validation entry below. Deterministic tests use explicitly labeled test doubles and mocked fetches; they are not genuine API calls. The genuine runs used the existing server credentials only for fixed-host Binance GETs, and unauthenticated official Ondo page/history reads. Official research pages were browsed separately. No independent equity quote API, execution quote, simulation, wallet or broadcast endpoint was called. No trading-capable client path was added.

The committed capture provides every response audit for one successful six-endpoint run. Browser validation may make additional six-read evaluations plus issuer page reads; these remain local server-side observations and are accounted for in the completion entry. No comprehensive provider billing counter is claimed.

Security: schemas project safe fields; receipts contain no raw headers/errors; exact and pattern scans cover source, build, logs, snapshots and generated assets. The public Pages fallback and frozen source/branch references remain unchanged. Hosting is research-only; recommended separate Render Free Node service has cold-start, quota and ephemeral-snapshot limitations.

## Completion validation

- Canonical suite: **107 passed, 0 failed** (88 baseline tests plus 19 competition tests). Covers temporal boundaries, deterministic digests, mutations, provenance exclusions, discovery disagreement, real adapter paths with mocked responses, synthetic guards, missing credentials, snapshot corruption/concurrency/outage retention and all engine scenarios. These tests do not make external provider calls.
- Static regression: **15 model + 4 output tests passed**. Total automated Node tests: **126**, with no skipped tests. Frozen static source/output was not rebuilt or deployed by this upgrade.
- Lint, standalone TypeScript check and final production build passed. Final build also reran TypeScript; `/live` is a dynamic Node server route.
- Production Edge QA passed on **1440/390/320 px**, all **12 scenario decisions**, canonical receipt copy/clipboard/hash, provenance expansion, separate historical snapshot, unavailable current evidence and synthetic `/live?mode=live` guard. No browser console errors, external browser requests or horizontal page overflow were observed. Failure/synthetic server modes made **zero fetch attempts**, enforced by preload instrumentation. See [results](../qa/live-evidence/results.json) and adjacent screenshots. Human 30/90-second comprehension remains unmeasured.
- First browser attempt stopped at a strict locator collision between two existing synthetic banners, after live receipt/mobile checks had passed. The test selector was narrowed. The second passed; the third followed a real unavailable-clock correction and screenshot framing correction. A fourth full pass verified the credential-free build still uses live credentials only at runtime. No product failure was hidden by substituting fixtures.
- Exact credential scanner initially hit a CommonJS named-import incompatibility before scanning. Changed it to the package default export and reran; scan results are recorded below. This was a local tool failure, not a provider/security finding.
- The first successful exact-value scan found credentials in **three ignored binary Turbopack cache files**. Pattern-only scanning had skipped binaries and reported none. No match appeared in browser bundles, receipts, screenshots or other inspected artifacts. Push was held. Removed the affected cache after resolving the OneDrive reparse flag to a verified non-symlink path inside this workspace; disabled Turbopack persistent build/dev caches; added `build:live-safe` to build from allowlisted source with no environment files or provider credentials and zero network access. This finding is retained here; an ordinary build's clean text scan was not treated as sufficient security evidence.
- The first isolated-build preparation hit EPERM when a Windows cloud-backed directory was misclassified by `Dirent.isDirectory()`. Replaced that check with `statSync().isDirectory()` while continuing to reject actual symlinks. Dependencies are linked locally; no package installation or credential copy is part of this build.
- Offline receipt verifier accepted the diagnostic capture and the final JSON copied from the production UI, reproducing WAIT and each displayed digest. A digest is not a provider signature.

### Genuine calls versus mocks

Documented local integration runs: five initial Binance diagnostics; three completed Binance requests before the signing-path failure; six after the fix; and four browser evaluations of six requests each. That is **38 audited successful Binance GET responses** across those runs. The failed chain signing attempt and Node ENOMEM failure sent no chain/provider request respectively. Ondo asset reads accompanied the two pipeline captures and four browser evaluations (**six reads**); the two capture-script history requests returned **403**. These counts describe the documented integration runs, not a provider billing meter. Public documentation browsing is additional research traffic. No independent equity data API, quote, simulation, wallet or broadcast request occurred.

Final browser evaluation: `2026-10-06T13:31:07.937Z`, NVDAon `243.547028439769000074`, provider time `13:31:02.372Z`, received `13:31:07.542Z`. Original token state LIVE; full evidence PARTIAL; WAIT with eight blockers. Scheduled session had advanced to regular; authoritative state remained UNKNOWN. These are historical recorded values after capture. [Final canonical receipt](../competition/browser-captured-evidence.json) and [initial complete capture](../competition/captured-evidence.json) remain separately inspectable.

### Final security/build result

The isolated production build passed with **0 environment files copied and 0 provider fetch attempts**. Both Turbopack filesystem caches were disabled. Runtime browser testing then obtained genuine Binance evidence using only the existing server environment, proving the synthetic build-time guard was not baked into live runtime behavior. Its unavailable and synthetic modes again made zero fetch attempts.

After remediation, the exact owner-value scan checked **551 files including binary output**, with **0 findings**. The complementary pattern scan checked **531 text files**, skipped **21 binary files** (covered by the exact scan), and found **0 credential patterns**. Scope: tracked/untracked source, both root and isolated `.next` outputs, task logs, public historical receipt artifacts, local receipts/snapshots, screenshots and frozen static assets. `.env.local` is the private comparison input, not an artifact to publish. Initial cache findings and their remediation remain recorded above; the final clean scan does not erase that history. No browser/public credential exposure was found.

No trade, wallet connection/signature, transaction simulation/broadcast, paid subscription/trial, new hosted deployment, change to the existing Pages deployment or merge into main occurred. Only the requested competition branch is intended to be committed/pushed after validation.
