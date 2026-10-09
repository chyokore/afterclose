# Reviewed release promotion candidate — approval required

Prepared October 9, 2026 on `codex/release-promotion-audit`. **No merge, main-branch update, deployment, form submission or secret change has been performed by this audit.** This document is a review artifact, not permission to perform those actions.

## Branch reconciliation

| Ref | Observed commit | Relationship |
| --- | --- | --- |
| Public GitHub default branch `main` | `4f33b77717aa72db8281beeeb0c60a0a61639f8b` | Behind the verified release by 27 commits; no unique/divergent commits. |
| `codex/cloudflare-live-integration` | `89b30a64b479bd4f19d85dd80becd6d6de55eef1` | Exact reviewed release-evidence baseline. No subsequent release fixes were found in fetched refs. |
| Deployed frontend and gateway source | `8eba2c989e881dbd2db83402c5cdd4a6602c8030` | Runtime source preceding the documentation/evidence commit above. |
| Proposed candidate | `codex/release-promotion-audit` | Descends from `89b30a6`; adds the cleanup and reproduction changes below. |

The baseline `main` → release diff contains 200 changed files, 23,613 insertions and 5,022 deletions, including the dependency lockfile, legitimate historical evidence and screenshots. It is not just a README update. Preserving those 27 commits and advancing by fast-forward after approval is the smallest non-rewriting promotion: no cherry-picked partial runtime, no recreated history, no lost evidence and no overwritten main-only work. The audit has not run a merge. An ancestry comparison establishes fast-forward compatibility for the fetched refs; concurrent remote changes still require rechecking.

## Reviewed areas

- **Canonical decisions:** `src/lib/reference-truth/engine.ts` and `models.ts` are unchanged between main and the verified release. The release adds canonical receipt, freshness and reproducibility code with explicit missing-evidence handling. This audit changes none of that runtime or its thresholds.
- **Provider boundary:** release changes add fixed read-only chain metadata, request allowlists, bounded JSON, secret-reflection rejection, controlled failures and separate provider/observation clocks. Supabase checks actual Frankfurt runtime region and exact CORS, and has bounded per-isolate captures/cooldowns. This audit changes none of these paths.
- **Frontend:** the published static page remains explicit-refresh only, with no privileged browser credential, no auto-retry/polling and no synthetic fallback. All 12 Scenario Lab fixtures remain separate. `public-live/*`, gateway runtime, original receipts and screenshot evidence remain byte-identical to the release.
- **Package/configuration:** package identity and repository metadata refer only to AfterClose. Main's Next/Next environment/ESLint 16.3.6 → release 16.3.8 upgrade and the release's existing Cloudflare tooling are preserved; no dependency versions or lockfile change in this audit. Vercel Git auto-deploy remains disabled; the current Cloudflare project has Direct Upload, not a Git connection. Historical Workers/Node-host experiments remain archived and do not replace the Pages/Supabase architecture.

## Minimal additions beyond the verified release

1. Removed 12 documentary references to the owner-identified unrelated project across eight files, including disclaimer-style mentions. No substitute project identity was inserted. A case-insensitive/encoded byte scan of tracked/new files found no remaining references; unrelated repository links, paths or runtime credentials were not found.
2. Removed an unused public-chain variable from examples and setup documentation. BSC 56 is enforced in source. Documented the actual server-only credentials, production mode, optional local synthetic mode and host-supplied Supabase region.
3. Added the [judge proof index](../submission/proof-index.md) and [fresh-clone reproduction guide](../reproduction.md), and corrected current navigation. Older runbooks are labeled historical instead of having their recorded results rewritten or deleted.
4. The default `npm run build` uses the existing isolated safe builder; added explicit public-build and 190-test baseline scripts. The already-isolated historical OpenNext rehearsal retains its direct staged Next build, preventing recursive staging. No build command deploys anything.
5. The optional local UI replay reads the committed genuine historical receipt instead of an ignored developer capture. Its banner and initial copy explicitly say historical replay, not current market data. The production-mode HTML and runtime are unchanged.
6. Standardized two offline benchmark dummy credentials to the same short test-only values used elsewhere. This changes no real secret or authenticated request. Pattern scanners need no allowlist or weakening.

## Evidence, deployment and rollback preservation

- Production remains https://afterclose-preview.pages.dev/, deployment `d5099b58-7acd-4a6c-a660-109bc6941bb0`.
- Frankfurt remains project `wakuqrnxjwikvlrxgezg`, with the existing manually deployed bundle and secrets.
- Synthetic rollback remains deployment `0bd20e4d-c861-4ee0-898f-ea43c579fc44`, source `538b119`, immutable URL https://0bd20e4d.afterclose-preview.pages.dev. Its local `.tools/pages-release/dist` is untouched.
- Before local rebuilds, saved the verified live artifact and gateway bundle under ignored `.tools/release-promotion-audit/verified-public-dist`, `verified-supabase-index.ts` and `verified-supabase-build.json`. Local candidate builds are not promoted and do not change hosted state.
- Historical production/staging receipts still verify against their original SHA-256 values. Existing provider-call accounting remains factual; this audit makes no new live evidence requests.

## Validation and security review

Completed local validation: **190/190 baseline tests plus 3/3 gateway-package tests**; TypeScript and ESLint passed; isolated Next.js, static lab, public frontend, local replay, legacy gateway package/prototype and Supabase bundle builds passed. The safe Next.js build copied zero environment files and attempted zero provider fetches. The historical production receipt reproduced WAIT and its exact expected digest. Local HTTP replay served that same committed receipt and prominent historical labels without provider requests. See [machine-readable audit results](release-promotion-audit.json).

Exact-value scan: 494 files including binary output, zero credential matches. Pattern scan: 465 text files plus 30 skipped binaries, zero findings. Browser boundary: 41 files, zero secret-name or authentication-material findings. The owner environment file was inspected for key applicability only: no unrelated keys; one unused legacy non-secret chain setting is ignored by the application and was left untouched. No secret or private environment file was modified.

The history scan covered 368 reachable Git blobs and found **zero exact configured-credential matches**. Two credential-pattern hits were verified fixed dummy constants in two historical versions of the offline CPU benchmark: no dotenv loading and all outbound calls replaced with mocks. They are not exposed secrets. There were 22 historical blobs containing the removed identity; those immutable historical versions remain because removing them would require a separately approved history rewrite. No force-push or history rewrite is proposed.

Existing limitations remain explicit: CORS is not caller authentication; per-worker and tab-session controls are not global rate limiting; receipts do not prove provider authenticity; no independent equity feed, wallet, execution or simulation exists. Full dependency-advisory and provider-license certification are not claimed by these credential/source scans. The prior owner's clipboard check passed; the embedded browser's optional download verification limitation remains documented in the release record.

## Approval-gated promotion procedure

1. Review the candidate diff and validation results. Resolve any new security findings before approval. No content conflict exists against the fetched main baseline.
2. Obtain separate owner approval identifying the reviewed candidate commit and permitting the main update. This audit does not supply that approval.
3. Fetch again. Verify public default remains main and its head still equals the reviewed baseline, or review intervening changes. Require main to be an ancestor of the approved candidate. Stop on divergence; never reset, force-push or overwrite unrelated work.
4. Advance main only to the approved candidate by fast-forward, using a normal non-force push and respecting repository protection. If policy requires a PR, use that review path rather than bypassing it.
5. Verify the public README/proof links and resulting main commit. Do not trigger deployment, alter secrets or submit forms as a side effect. Any separate runtime release requires its own approval and staging validation.

Until step 2 is approved, the public default branch remains unchanged and the candidate is review-only.
