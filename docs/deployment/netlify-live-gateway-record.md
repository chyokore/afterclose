# Netlify live gateway deployment record

Prompt 22, 2026-10-07. Deployment is in progress; hosted live evidence is not yet verified. Cloudflare and Render remain unchanged.

## Source and cost preflight

- Authorized source: `codex/zero-cost-live-gateway`, `e00bfb358c0fd1b6eb787bee591708fac7df8dbc`. Remote branch matched; worktree clean; gateway/build configuration and unchanged canonical engine committed. Only `.env.example` tracked, no credential file.
- Actual team `chyokore` (display name AfterClose): Free, $0.00, 300 credits/month, 300/300 available, no usage or invoices. UI explicitly states no overage charges and that payment information is unnecessary. No saved card. Free has no auto recharge; exhaustion pauses service under the official [pause rules](https://docs.netlify.com/manage/accounts-and-billing/billing/resume-paused-projects/).
- Owner signed in directly and authorized the official Netlify CLI. CLI 27.11.2, local Node 24.21.0. No authentication values captured in this record.
- Exactly one empty project created: `afterclose-live`, ID `ae1c54f9-5751-495e-987d-2994c2e281fe`. Reserved base URL: `https://afterclose-live.netlify.app`. This is not yet a verified live endpoint.
- No Git integration, additional project, custom domain, database, scheduled/background function or paid add-on created. Project initially private by Netlify default.
- Isolated package outside repository contains only `netlify.toml`, function entry, bundled library and public index. Non-secret environment settings: `AFTERCLOSE_DEPLOYMENT_MODE=competition-live`, `NODE_ENV=production`, `AWS_LAMBDA_JS_RUNTIME=nodejs24.x`. Binance secrets await owner entry.

## Compatibility correction

The first credential-free draft attempt discovered one function but Netlify rejected it with HTTP 422: explicitly configuring function memory requires Pro or higher on credit-based pricing. No successful deployment resulted and no upgrade was selected.

The permitted small compatibility correction removes `memory:1024` from the exported function config, retaining only the exact route. Netlify's default remains 1024 MB. The corresponding package test now rejects a memory override. This changes no provider, evidence, cache, CORS, receipt or engine logic. Do not restore the override on Free. Prompt 21's statement that memory could be explicitly configured on Free was incorrect; the actual deployment API established the restriction.

All 169 tests, gateway/static/prototype builds, lint, TypeScript and credential scans are rerun before retrying. The compatibility commit is the commit introducing this record; subsequent hosted results will identify the exact deployed source commit.

## Pending

Credential-free hosted packaging and receipt verification, public visibility, private owner credential entry, one production deployment, genuine hosted provider evidence, receipt equivalence, cache/coalescing and abuse checks, final security scans, usage reading and integration values remain pending. No Cloudflare integration is authorized in this milestone.
