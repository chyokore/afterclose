# Owner checklist — later authorization only
Do not execute this checklist until the owner approves the reviewed architecture. This milestone did not create a service, connect GitHub or transfer secrets.

1. Confirm a Hobby workspace can create Free compute with no payment method, card verification, authorization hold, trial or upgrade. Stop if any is required. Set additional pipeline spending to zero; check workspace-wide usage.
2. Confirm acceptance of cold starts, quota suspension and ephemeral snapshots. Keep https://afterclose-preview.pages.dev/ as the unchanged synthetic fallback.
3. Choose New → Web Service → public Git repository URL: https://github.com/chyokore/afterclose.git. Public URL manual deployment avoids GitHub authorization. Select branch `codex/live-deployment-readiness`; verify the reviewed final commit. If a different source or Git connection is required, stop and review.
4. Runtime: Node. Root directory: repository root. Instance: explicitly Free (0.1 CPU / 512 MB). One instance. Auto-deploy: Off. No database, disk, background worker, cron, custom domain or paid add-on.
5. Build command: `npm ci --include=dev --ignore-scripts --no-audit --no-fund && node scripts/build-live-safe.mjs`.
6. Start command: `node node_modules/next/dist/bin/next start --hostname 0.0.0.0 --port $PORT`.
7. Set NODE_VERSION to the reviewed Node 24.21.0 release and AFTERCLOSE_DEPLOYMENT_MODE to competition-live. Set NEXT_TELEMETRY_DISABLED to disable telemetry if desired. PORT is supplied by Render. Do not set AFTERCLOSE_PREVIEW_MODE or override BINANCE_WEB3_BASE_URL.
8. Enter BINANCE_API_KEY and BINANCE_SECRET_KEY only in Render's private environment-variable controls. Treat both as secrets; never public variables, repository files, build command arguments or screenshot content. Do not copy values into this checklist. Do not assume a separate “secret” checkbox exists: protect the environment entries and access permissions.
9. Set health-check path `/api/health`. Confirm no pre-deploy command or .next/cache persistence. The safe builder must report zero provider fetch attempts and zero copied environment files.
10. Only after authorization and all preflight checks, create/deploy the service. Expect an HTTPS URL shaped `https://<chosen-service-name>.onrender.com`; exact availability/name is unknown until creation.
11. First startup may take approximately a minute on Free compute. Render's wake page precedes app loading. The app then displays “Starting live evidence service…” while bounded provider calls run. If they fail, expect unavailable evidence, WAIT and Retry; never a fixture token price.
12. Verify clean build identity (no working-tree label), source digest and engine identity. Complete [hosted verification](render-hosted-verification.md) before sharing the live URL.
13. Watch memory, CPU, response latency, bandwidth, instance hours and build minutes. Do not add a payment method to fix quota exhaustion. Do not create a keepalive job.
14. If correctness, credentials or cost controls fail: suspend the live service from its settings, keep auto-deploy off, and use the unchanged static fallback. For a code regression, manually roll back only to a previously verified safe live deployment (Free retains two prior deploys); never use a synthetic build as live. Recheck environment controls after rollback. Rotate provider credentials if exposure is suspected, without publishing them.

Official controls: [web services](https://render.com/docs/web-services), [manual deploys](https://render.com/docs/deploys), [environment settings](https://render.com/docs/configure-environment-variables), [free limitations](https://render.com/docs/free).
