> Historical AfterClose milestone/runbook. Current release: [Cloudflare + Supabase](public-live-release.md); current judge path: [proof index](../submission/proof-index.md). Historical commands are not authorization to deploy or alter accounts.

# Public static preview deployment

Mode B was explicitly approved by the owner in this chat. Deployed 2026-10-06 at 12:10:39 UTC using Cloudflare Pages Direct Upload.

- Production: https://afterclose-preview.pages.dev/
- Deployment: https://0bd20e4d.afterclose-preview.pages.dev/
- Project: `afterclose-preview`
- Deployment ID: `0bd20e4d-c861-4ee0-898f-ea43c579fc44`
- Environment: production; branch `codex/static-synthetic-preview`.
- Frozen product source: `070bcb248d5b380dbf6a6a7ebb7ac7753c7d1771`; release-plan commit: `538b1192ec832c59d094a955c19080c71e543cb5`.
- Release contents and SHA-256 values: [release manifest](static-preview-release-manifest.md). All six staged files matched before upload. Five static assets uploaded; `_headers` processed separately by Pages.

The earlier checklist's NOT DEPLOYED and approval-pending statements describe its preparation date; this record supersedes those status statements. The original artifact is unchanged.

## Configuration

Public access, no Access authentication, custom domain, DNS changes, paid upgrade or payment entry. No Git integration, environment variables, KV, D1 or R2 bindings. No runtime functions or Worker entry point in the uploaded artifact. No provider APIs, live market data, wallets or transactions.

The installed Wrangler initially tried to delegate Pages creation to the older Workers configuration; this failed before deployment. Creation then used the Pages-only `--force` option and an isolated static configuration. After successful creation, upload ran from `.tools/pages-release` with its local `wrangler.json`, using `pages deploy dist --project-name afterclose-preview --branch codex/static-synthetic-preview`. Pages rejected a custom configuration path for upload, so none was passed on the successful command. The repository's runtime configuration was not modified or deployed.

## Hosted verification

- Production and unique deployment URLs are publicly accessible without authentication.
- All five served asset bodies match their release SHA-256 on both hostnames: ten matches. `_headers` takes effect as HTTP response headers, including `connect-src 'none'`.
- Missing HTTP paths return 404 on both hostnames.
- All 12 scenarios match canonical engine decisions and ordered findings at 1440, 390 and 320px: 36 comparisons.
- 12 direct scenario reloads, 3 additional refresh checks, 8 keyboard checks, 45 overflow checks, 6 missing-page/route checks and 1 controlled error check passed.
- Browser audit: zero external requests, zero API attempts, zero page errors; 60 same-origin asset/document requests. Ten hosted screenshots captured; mobile landing and desktop review inspected.
- Separate unmodified browser run on both hostnames: zero console errors and zero unexpected requests across landing, WAIT and PROCEED_TO_REVIEW routes.
- Root hosting is used; the local-only `/afterclose/` prefix test was intentionally omitted.
- Sanitized detailed results and screenshots are retained locally in ignored `.tools/pages-release/`.

The previous local canonical 88, model 15, output 4, lint and TypeScript checks remain applicable because no product source or dependency changed. No sharing with judges or other recipients was performed.

## Take offline

Use [the owner rollback procedure](OWNER-DEPLOYMENT-CHECKLIST.md#rollback--take-offline) for project `afterclose-preview`. Delete that exact Pages project to remove production and deployment URLs, then verify both URLs and `/assets/preview.js` no longer serve AfterClose. There is no Access configuration or custom DNS to remove. Preserve Git and the local frozen artifact.
