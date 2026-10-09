> Historical AfterClose milestone/runbook. Current release: [Cloudflare + Supabase](public-live-release.md); current judge path: [proof index](../submission/proof-index.md). Historical commands are not authorization to deploy or alter accounts.

# AfterClose owner deployment checklist

**NOT DEPLOYED. Prepared 2026-10-05. These are future owner actions, not authorization to execute.**
Choose exactly one mode after explicit owner deployment approval. Architecture approval is not deployment approval. No Cloudflare login, resource, upload, payment details, Access policy or DNS change was made during preparation.

## Method and cost decision

| Method | Release fit |
| --- | --- |
| **Direct Upload — recommended** | Transfers the reviewed build; no repository connection, hosted build or build secrets needed. |
| Git integration | Requires repository authorization and build configuration; pushes can trigger deployments. Adds unnecessary moving parts for this frozen release. |

Both permit project deletion. Direct Upload cannot later become a Git-integrated project. Use Pages, not the full application's Workers/OpenNext configuration. Sources: [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/), [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/).

Pages static requests are currently free and unlimited when they do not invoke Functions. This six-file artifact has no Functions, Worker entry point or API routes; expected preview traffic incurs **$0 application compute and $0 static request charges** under that boundary. Browser JavaScript runs on the visitor's device. [Pages pricing](https://developers.cloudflare.com/pages/functions/pricing/)

Access on Zero Trust Free has **no monetary subscription fee**. However, Cloudflare explicitly requires payment details during Zero Trust onboarding even for Free, while stating that Free is not charged. Account eligibility and the actual checkout have not been verified. Only the owner may accept that onboarding step after approval. If unwilling to supply payment details, stop; do not silently switch to public access. [Zero Trust onboarding](https://developers.cloudflare.com/cloudflare-one/setup/)

### What can cause a charge?

Selecting a paid subscription, upgrading Workers/Zero Trust, or enabling separately billed services can introduce charges. Adding Functions on a paid Workers plan can create metered compute charges; static traffic alone does not. Do not enable paid plans, Functions, Workers runtime, storage bindings, AI, paid add-ons or a purchased domain. Do not add analytics or other injected scripts to this frozen artifact. A payment card alone does not change the documented Free fee, but inspect the displayed plan and amount before accepting anything. Pricing is current documentation, not a future price guarantee. [Pages billing boundary](https://developers.cloudflare.com/pages/functions/pricing/), [Cloudflare plans](https://www.cloudflare.com/plans/zero-trust-services/)

## Before either mode

1. Record the owner's explicit approval, chosen mode and chosen unique project name. For A, also obtain the owner's exact email privately; never commit it or a login code.
2. Open [Cloudflare dashboard](https://dash.cloudflare.com/). Select **Workers & Pages → Pages** and the **Free** offering. Keep the generated `pages.dev` hostname; no custom domain or DNS changes.
3. Check [release manifest](static-preview-release-manifest.md): six files, 488,751 bytes, every SHA-256 must match. Upload only `static-preview/dist` from the AfterClose repository root, with `index.html` at the upload root. Include `_headers`, `.nojekyll`, `404.html` and both assets. Never upload the repository, `.env`, `.tools`, `.next`, `.open-next`, source code or server configuration. Any mismatch stops release.

## MODE A — Restricted owner preview

Purpose: owner QA. **Procedure prepared; account setup and protection-before-upload remain unverified.** Do not use a creation flow that immediately publishes AfterClose.

1. After approval, select **Zero Trust → Free** and complete owner-controlled onboarding. This is where payment details are required. Stop if the plan is paid or terms differ.
2. **Zero Trust → Integrations → Identity providers → Add new identity provider → One-time PIN**. OTP is not automatically enabled for new organizations. [OTP setup](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/)
3. Create an **empty** Pages project using the existing local Wrangler CLI. From a new empty working folder outside the repository, run the following future-only PowerShell commands (replace `OWNER_CHOSEN_PROJECT`):

   ```powershell
   # Set this to your actual AfterClose clone, before switching to the empty folder.
   $releaseRoot = (Resolve-Path '<YOUR_AFTERCLOSE_CLONE>').Path
   $releaseNode = (Get-Command node -ErrorAction Stop).Source # Node 24.x
   $releaseWrangler = Join-Path $releaseRoot 'node_modules\wrangler\bin\wrangler.js'
   & $releaseNode $releaseWrangler login
   & $releaseNode $releaseWrangler pages project create OWNER_CHOSEN_PROJECT --production-branch codex/static-synthetic-preview
   ```

   No deploy command yet. Record the actual assigned hostname; do not guess it.
4. Pages project **Settings → Enable access policy → Manage**. In **Access → Applications**, configure the generated application: remove `*` from its public-hostname Subdomain field and save. Return to Pages **Settings → General → Enable access policy** again. Confirm two applications cover exactly `<project>.pages.dev` and `*.<project>.pages.dev`, with no path restriction. The first covers production; the second covers deployment and branch preview hostnames. The preview toggle alone is insufficient. [Official Pages protection procedure](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain)
5. In **both** applications select OTP as the login method. Set policy action **Allow**, Include selector **Emails**, value **only the owner's exact email**. Remove any broader Allow, domain-wide, Everyone, Bypass or service-token grant. Unmatched identities are denied. [Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
6. Before uploading, inspect both hostname/policy configurations and test the production and a preview hostname in a fresh incognito session: Access must intercept unauthenticated requests. Authenticate as owner with email OTP. **If the empty project cannot be protected or the gate cannot be verified before upload, STOP and return to ChatGPT; do not publish temporarily.** This account-specific behavior was not exercised locally.
7. In the empty Pages project choose **Create a new deployment → Production**; drag in only the verified `dist` folder and select **Save and Deploy**. Record the production URL and unique deployment URL.
8. Repeat access tests on **both actual URLs**, including `/assets/preview.js`: incognito without login cannot retrieve AfterClose or its bundle; a non-allowlisted email cannot enter; owner OTP succeeds. Test every additional preview alias if one is created. A leaked route fails release: use rollback below.

## MODE B — Public judging preview

Purpose: unauthenticated judging. Requires explicit owner **public-access** approval, including when organizers require an immediately accessible URL. No organizer requirement or public-access approval has been established by this task. This mode excludes Mode A; do not remove A's protection without a separate decision.

1. From Workers & Pages choose **Create application → Get started → Drag and drop your files** in Pages. Enter the approved project name, upload only verified `dist`, then **Deploy site / Save and Deploy**. No Git connection, build command, environment variables or Access setup. [Dashboard upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
2. Record the assigned production and unique deployment URLs. Confirm both load in incognito without authentication. The artifact remains synthetic-only: no credentials, live market data, provider API, wallet or transactions.

## Verify immediately after any future deployment

- Expected production and deployment URLs load under the chosen access mode; synthetic warning remains prominent and landing content is correct.
- Test all 12 scenario links listed in the manifest. `stale-reference` gives **WAIT**; `fresh-evidence` gives **PROCEED_TO_REVIEW** with synthetic labels and execution disabled. `market-closed` gives **MONITOR**; the other nine give **WAIT**.
- Tab/Enter through navigation and controls; check visible focus, skip link and evidence-table scrolling. At 390px, content and controls fit with no page overflow.
- Refresh the landing and scenario pages. Open each `/#/lab/<scenario-id>` directly in a new tab. An unknown hash shows the missing-route view; `/definitely-missing` returns HTTP 404 with the static missing-page content.
- In DevTools **Console**, clear logs and repeat the flow: no application errors. In **Network**, disable cache, preserve log, reload and visit every scenario. Review **All** and **Fetch/XHR**, plus WebSocket/other entries. Application requests must be same-origin static documents/assets only: **0 external provider/API requests**. Access authentication traffic in A is hosting infrastructure and must be identified separately, not mistaken for app provider traffic.
- Any Binance, Ondo, equity-provider, wallet API, quote endpoint or simulation endpoint call **FAILS DEPLOYMENT VERIFICATION**. Take the preview offline using rollback until investigated. Unexpected requests, missing headers, hash mismatch or behavior regression also stop approval. Check deployed asset bodies against manifest hashes if hosting changes are suspected.
- Record URLs, selected mode, date, result and sanitized evidence. **STOP and return to ChatGPT** before sharing with judges, changing modes or adding configuration. Never send payment details, OTPs, session cookies or tokens.

## Rollback / take offline

These future owner actions remove this preview only; none were executed.

1. Record all production, deployment and branch URLs from the project's Deployments list. Keep any existing Access protection in place.
2. To disable public serving and remove all versions, open **Workers & Pages → the exact AfterClose Pages project → Settings → Delete project**; confirm the project name and deletion. Deleting the project is the takedown, not rolling back to an older deployment (which still serves content). This plan creates no custom domain. [Delete a Pages project](https://developers.cloudflare.com/learning-paths/personal-website/pages-setup/git-manage-site/)
3. If dashboard deletion is unavailable and the CLI is already authenticated, initialize the three local path variables shown in A and, from an empty working folder, run `& $releaseNode $releaseWrangler pages project delete OWNER_CHOSEN_PROJECT`; confirm only the intended project. If removal fails, retain Access; if available, replace both applications' policies with **Block → Include Everyone**, removing all Allow, Bypass and Service Auth grants, and revoke existing application sessions. Do not claim offline until checked; return to ChatGPT for a failed deletion or if CLI authentication is unavailable. [Project deletion command](https://developers.cloudflare.com/workers/wrangler/commands/pages/), [policy actions](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/)
4. Verify all recorded URLs and `/assets/preview.js` from fresh incognito with cache disabled and a second browser/network: none may return AfterClose content. Wait for removal to propagate and recheck if needed. Previously downloaded copies cannot be recalled.
5. **Only after hosting is gone**, go to **Zero Trust → Access controls → Applications**, find each of the two exact project hostname applications, select its Delete action and confirm. Remove project-only reusable policies if unused elsewhere. Preserve shared identity providers, unrelated apps and the account. Repeat URL checks after Access removal so an authentication gate cannot mask a remaining public deployment.
6. Keep the repository, branch, commit history, release manifest and local `static-preview/dist` untouched. Do not merge, delete local files or remove unrelated Cloudflare resources.
