# Zero-cost hosting feasibility diary

October 5, 2026. **NOT DEPLOYED.**

## Motivation and preservation

The owner has Vercel Hobby and does not want a paid subscription simply to submit the hackathon before knowing its outcome. Vercel Hobby was not automatically selected because the owner requested an independent $0 eligibility/access-control investigation. This does **not** mean Vercel Authentication necessarily requires payment: the existing Vercel plan already documents a conditional Free path and remains unchanged. No decision about hackathon commercial eligibility was invented.

Started from clean branch `codex/restricted-synthetic-preview` at `eac2f459fc6c9e582a65dfe0b1fa26f0e9960cdf`. Created `codex/zero-cost-hosting-feasibility`. No merge, engine edit, app migration or root dependency upgrade. Prior Vercel documents are preserved byte-for-byte. Noctive was not accessed.

## Research and findings

Codex inspected app routes, metadata, server/client boundaries, guards, the two network transports, environment variables and build configuration. AfterClose is Next 16.3.6 / React 19.2.8, dynamic App Router with RSC refresh and query-selected server scenarios. No app filesystem/storage/route-handler/middleware/wallet dependency exists. Static export would require behavior changes and was not attempted as a hosting shortcut.

Official Cloudflare sources investigated: [Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/), [OpenNext guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/), [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [limits](https://developers.cloudflare.com/workers/platform/limits/), [build quotas](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/), [Node compatibility](https://developers.cloudflare.com/workers/configuration/compatibility-flags/), [provider domains](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/), [Worker Access defaults](https://developers.cloudflare.com/changelog/post/2026-08-14-workers-access/), [Zero Trust setup](https://developers.cloudflare.com/cloudflare-one/setup/), [email OTP](https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/) and [Access policies](https://developers.cloudflare.com/cloudflare-one/access-controls/policies/).

Current docs differ from older examples: Cloudflare recommends vinext for new projects; the existing-app OpenNext path remains documented. Node compatibility is now enabled by recent dates. The Worker limit is now 64 MiB uncompressed, while the older adapter guide still mentions 3 MiB compressed. We used current platform docs rather than those stale limits.

Workers Free provides a genuine $0 runtime tier; Access Free provides an identity gate without buying a custom domain. The intended small, non-critical fictional demonstration appears consistent with hobby/PoC descriptions, but actual account acceptance is unverified. Zero Trust onboarding explicitly requires payment details even for Free; we did not request details or initiate billing. Free is not a no-card promise. Ten milliseconds of CPU per request remains a material SSR constraint.

OpenNext latest `1.20.8` declares Next `>=15.5.27 <16 || >=16.3.8`; our exact baseline is outside that range. Previous `1.20.7` declares compatibility with 16.3.6 and was chosen strictly for an isolated local baseline experiment, not a deployment recommendation. [Next 16.3.8](https://github.com/vercel/next.js/releases/tag/v16.3.8) includes security fixes. No peer override or app patch was applied. Wrangler inspected: `4.147.0`, Node >=22; local Node used: 24.21.0.

The existing unset-mode rule intentionally retains live behavior outside Vercel. Future Cloudflare hosting therefore requires a small Worker entry check that refuses a missing/non-synthetic binding before delegating to Next. Missing Binance secrets alone cannot prevent Ondo reads. This is classified **B — Small migration** and is documented, not implemented, in accordance with the user's boundary.

## Local work and reproducibility

- Strengthened `scripts/rehearse-synthetic.mjs` with 14 HTML/RSC attacks using mode query strings, malformed/duplicate scenarios, forged headers and cookies; three `/live`, `/demo/live`, `/api/live` probes; metadata assertions. Existing dashboard, all 12 scenarios, fallback/404, repeated refresh and asset checks remain.
- Added `scripts/scan-credentials.mjs`: checks tracked/new non-ignored text files for private-key blocks, GitHub-token patterns and long Binance credential assignments. Reports filenames only; it does not print or read ignored local credential values. This bounded pattern scan is not a general guarantee about all secret formats.
- Root dependencies are unchanged. Cloudflare experiment files are isolated under ignored `.tools/cloudflare-feasibility`. Only sanitized source/config/package files were copied; no `.env.local`, provider key or captured observations were copied.
- Public npm install in the experiment: `@opennextjs/cloudflare@1.20.7`, `wrangler@4.147.0`, with exact requested versions. It uses a process-environment allowlist and disables Wrangler metrics/Next telemetry. Package downloads are tooling traffic, not provider calls. Install warnings included deprecated `node-domexception`, `glob@9.3.5`, and `eslint@9.39.5`; no forced/audit-fix upgrades were made.
- Experiment config: `defineCloudflareConfig()`, date `2026-10-05`, explicit `nodejs_compat`, local `ASSETS`, `workers_dev=false`, `preview_urls=false`, binding `AFTERCLOSE_PREVIEW_MODE=synthetic`; no remote resource bindings. A local-only wrapper blocks/counts global external fetch and annotates responses for measurement. It is not an Access policy or production entrypoint.
- Only adapter **build** and, if build succeeds, Wrangler **dev --local** are candidates for execution. No login/migrate/deploy command, even dry-run deploy, is permitted. Bundle sizes can be inspected locally without a deploy command.

## Validation and actual failures

- Full test suite rerun: **86 passed, 0 failed, 0 skipped**. Provider tests use mocks; the direct-adapter isolation spy makes zero fetch calls in synthetic/invalid modes, with and without dummy keys. No live diagnostic was run.
- Full ESLint and full-checkout `tsc --noEmit` passed after initial rehearsal additions.
- Fresh isolated Node production build passed with Next 16.3.6. The subsequent HTTP driver passed the new 14 adversarial requests, three route probes and metadata assertions, then encountered `UND_ERR_SOCKET` (loopback peer closed a reused connection) during later checks. The harness now requests fresh connections and saves per-mode runtime logs. It retries the same successful, unchanged build; this does not substitute a new application build or hide the initial failure.
- Loading/error wording and layout labeling are covered by existing source assertions. A generated server error from invalid configuration is exercised by the HTTP rehearsal. No interactive browser screenshot or forced slow-network visual inspection is claimed.

Adapter/build/runtime, credential scan and Node retry results are recorded below. A passed local runtime would still not prove Cloudflare Access or hosted CPU limits.

## Recommendation and stop boundary

The [feasibility matrix](../deployment/zero-cost-hosting-feasibility.md) and [conditional future sequence](../deployment/zero-cost-restricted-preview-plan.md) separate documented, local, inferred and unresolved facts. Recommendation is conditional further local work, not a deployment GO. No alternative hosting survey was expanded because classification is B, and the user limited alternatives to C/D.

No account, project, deployment, DNS record, tunnel, access policy, token, purchase, wallet operation or transaction was created. No B/C migration was performed. The engine, historical-evidence standards, WAIT and clearly labeled synthetic fixtures remain unchanged. Stop before hosted resources or judge grants.

## Completed Node rehearsal and preservation checks

The same successful production build passed the fresh-connection retry: dashboard, all twelve scenarios, unknown-scenario fallback, 404, **14 adversarial HTML/RSC requests**, **3 route probes**, metadata/noindex checks, **3 refresh RSC requests**, and **11 JS/CSS assets**. Restarting with invalid server mode rejected `/` and `/demo`. Build/runtime fetch audit: **0 external/provider fetch attempts**. No provider secrets or env files were supplied. Both servers were stopped. This was a test-driver connection fix, not an app change. Rehearsal artifacts: `.tools/synthetic-rehearsal-1791199032433`.

Credential scan at this checkpoint: 73 text files scanned, zero pattern findings. `git diff` against the baseline was empty for `src`, `package.json`, `package-lock.json`, `docs/deployment.md` and `docs/deployment/restricted-preview-plan.md`. Final counts/status are checked again before push.

The isolated adapter install completed with 643 packages in 14 minutes. npm additionally reported five unapproved install scripts (esbuild variants, unrs-resolver and workerd); no blanket script approval was given. The OpenNext build started successfully and explicitly reported Next 16.3.6, adapter 1.20.7, underlying OpenNext AWS 4.1.6 and date 2026-10-05. It warned that Windows is not fully supported and recommended WSL. These warnings are retained as compatibility evidence, not suppressed.

## Cloudflare adapter and workerd results

**OpenNext build passed** on the unchanged baseline using the local-only compatible pair. It completed Next compilation/TypeScript, generated server/assets/cache bundles and wrote `.open-next/worker.js`. No unsupported application API caused a build failure. Root package files were not changed.

`wrangler dev --local --ip 127.0.0.1 --port 3188` ran successfully with only local `ASSETS` and the synthetic mode binding. The request driver passed **52 top-level HTML/RSC cases** spanning dashboard, lab, all twelve scenarios, fallbacks, malformed/duplicate scenario values, mode queries, forged headers/cookies and unknown/API/live-route probes. Valid RSC responses were explicitly checked for `text/x-component` after redirects. Every app response counter reported **0 external fetch attempts**. No live provider credentials were supplied. The generated tree contains **1,140 files / 22,454,795 bytes**; this is raw adapter output including assets/support files, not the final deployable Worker bundle size. No deploy/dry-run command was used to measure it.

Behavioral differences/warnings:

- OpenNext emitted 307 canonicalizing redirects for valid RSC requests without its expected query marker; following them returned verified Flight responses. Thus 52 driver cases represent more than 52 underlying HTTP requests. Counters remained zero.
- First local workerd dashboard responses took about three seconds wall time; later responses were much shorter. These are local wall times, not hosted CPU measurements; no claim about meeting the 10 ms Free CPU limit follows.
- Wrangler attempted to retrieve its developer `Request.cf` metadata and could not verify the TLS certificate, twice, then used a placeholder. These are tooling requests to Cloudflare, not application/provider fetches, authentication or resource creation. TLS verification was not disabled, and no local certificates were uploaded. AfterClose does not use `Request.cf`.
- One repeated request run logged a ProxyWorker retry after a dropped local UserWorker connection; it recovered on attempt two and the assertions passed. Together with the documented Windows warning, this is a reason to repeat the supported patched pair on Linux/WSL before declaring a deployable candidate. No OS/distribution was installed and no runtime architecture was rewritten.
- Workerd runs were stopped by the harness. Cloudflare Access was not configured or tested; `ctx.access` mock identities were not used as an authentication substitute.

Current conclusion remains **B — Small migration; CONDITIONAL GO for the separately approved local patch/guard work only**. Local baseline compatibility is demonstrated, while patched-toolchain compatibility, Cloudflare missing-binding rejection, free CPU/startup fit, account onboarding/payment acceptance, actual Access coverage and revocation remain unresolved. No B/C migration was performed here.

Final workerd asset/metadata follow-up passed: **11 static JS/CSS assets**, synthetic title, and the same **52 HTML/RSC cases** with **0 application external fetch attempts**. The final run again recovered one local ProxyWorker connection drop (a malformed-scenario RSC request); no assertion failed. This strengthens the requirement for a Linux/WSL rehearsal of the supported patched pair, rather than claiming the Windows runtime is warning-free.

Final validation status: 86/86 tests, full lint and TypeScript, Node production build/rehearsal, OpenNext local baseline build, workerd route/asset checks, and credential-pattern scan passed within their stated scope. Hosted Access/CPU/startup and the future patched pair remain **unverified**. No app source or root dependency file was changed.

### Reproducing the local-only adapter experiment

This tests the old exact baseline, **not a deployable security recommendation**. Use Node 24. In a fresh ignored `.tools/cloudflare-feasibility` directory copy only `src`, package manifest/lockfile, `tsconfig.json`, `next.config.ts` and `postcss.config.mjs`. Do not copy env files. Install the exact baseline-compatible `@opennextjs/cloudflare@1.20.7` and `wrangler@4.147.0` only there. Keep the original checkout untouched.

Create `open-next.config.ts` containing `import { defineCloudflareConfig } from '@opennextjs/cloudflare'; export default defineCloudflareConfig();`. Create the following experiment-only `wrangler.json` (this file is not a hosted configuration):

```json
{
  "name": "afterclose-local-feasibility",
  "main": "rehearsal-worker.mjs",
  "compatibility_date": "2026-10-05",
  "compatibility_flags": ["nodejs_compat"],
  "workers_dev": false,
  "preview_urls": false,
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "vars": { "AFTERCLOSE_PREVIEW_MODE": "synthetic" }
}
```

Set only `AFTERCLOSE_PREVIEW_MODE=synthetic`, `NEXT_TELEMETRY_DISABLED=1`, `WRANGLER_SEND_METRICS=false` and required OS/PATH variables in the build process. From the experiment directory run the installed adapter's `node node_modules/@opennextjs/cloudflare/dist/cli/index.js build`. No login/migrate/deploy command is needed.

Create `rehearsal-worker.mjs` in that directory as the local fetch instrumentation:

```js
import worker from './.open-next/worker.js';
let calls = 0;
globalThis.fetch = async () => {
  calls++;
  console.error('AFTERCLOSE_EXTERNAL_FETCH_BLOCKED');
  throw new Error('External fetch forbidden in local synthetic rehearsal');
};
export default {
  async fetch(request, env, ctx) {
    const response = await worker.fetch(request, env, ctx);
    const headers = new Headers(response.headers);
    headers.set('x-rehearsal-external-fetches', String(calls));
    return new Response(response.body, {
      status: response.status, statusText: response.statusText, headers
    });
  }
};
```

From the repository root, `node scripts/check-cloudflare-local.mjs` runs the tested loopback-only workerd request/asset assertions, isolates Wrangler configuration, records logs and stops its child server. It does not install packages or create remote resources. The wrapper observes app global fetch attempts, not Wrangler's separate developer-metadata requests. Never upload this measurement entrypoint as a substitute for the future host-mode guard or Access.

Final pre-commit scan after adding the reusable local Worker checker: **74 text files, zero credential-pattern findings**. The checker uses the invoking Node executable's directory in PATH; it does not require changing root app dependencies. New/changed scripts passed targeted ESLint after the earlier full lint pass. No listeners remained on rehearsal ports 3187/3188.
