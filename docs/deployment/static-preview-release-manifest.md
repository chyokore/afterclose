> Historical AfterClose milestone/runbook. Current release: [Cloudflare + Supabase](public-live-release.md); current judge path: [proof index](../submission/proof-index.md). Historical commands are not authorization to deploy or alter accounts.

# AfterClose static preview release manifest

**Frozen locally; NOT DEPLOYED.** Verified 2026-10-05. Deployment requires a separate owner decision using [the owner checklist](OWNER-DEPLOYMENT-CHECKLIST.md).

- Source commit: `070bcb248d5b380dbf6a6a7ebb7ac7753c7d1771`
- Branch: `codex/static-synthetic-preview`
- Output: `static-preview/dist` relative to the AfterClose repository root.
- Files: **6**; total: **488,751 bytes** (477.30 KiB).
- Rebuilt from the clean approved commit using Node **24.21.0**, existing dependencies and `scripts/rehearse-static.mjs build`. Every file's size and SHA-256 matches the previous committed `docs/qa/static-preview/results.json` exactly.
- Server/runtime functions: **0**; API routes: **0**; Worker entry points: **0**. Static `_headers` is delivery metadata. Browser JavaScript evaluates synthetic fixtures locally.
- Canonical Reference Truth Engine, fixtures, product code, configuration and dependencies are unchanged. This release-plan commit changes documentation only.

## Exact upload contents

Paths are relative to `dist`; upload the folder contents with `index.html` at site root. No extra files are permitted.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `.nojekyll` | 0 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| `404.html` | 530 | `6446845d8623d18ec4cab16bb27718c7998124fb3b1038fd94656a807fe71732` |
| `assets/preview.css` | 10,852 | `ca173e3c20a106942362c3c90fc5af1dca8a26ec4328fda1e7d6b4b0cd9df3e8` |
| `assets/preview.js` | 475,248 | `3d793c4fa7e67afbdcaec9eac80d6d88afa3b084d24dc7e09bb2068f02f3ea41` |
| `index.html` | 1,797 | `43ad0a7c8d564643b83a893221d948950ac755ab55d8b6cd678b86be7bc5e3d1` |
| `_headers` | 324 | `db63b5f4299b01979ad49c03accafa6dda1a200bd33c3481c4211a8b1db66ded` |

## Final validation versus previous success

| Check | Previous | Release rerun |
| --- | --- | --- |
| Canonical tests | 88 passed | 88 passed; no failures/skips |
| Static model tests | 15 passed | 15 passed, including full engine-result parity for 12 scenarios |
| Generated-output tests | 4 passed | 4 passed |
| ESLint / TypeScript | Passed / passed | Passed / passed |
| Static build | 100 browser modules | Same; identical six hashes |
| Browser decision/finding comparisons | 36 | 36 passed across 1440, 390 and 320px |
| Direct scenario routes / refresh checks | 12 / 3 | 12 / 3 passed |
| Overflow / keyboard checks | 45 / 8 | 45 / 8 passed |
| Missing-route / controlled-error / prefix checks | 6 / 1 / 3 | 6 / 1 / 3 passed |
| External requests / API attempts / page errors | 0 / 0 / 0 | 0 / 0 / 0 |
| Local asset requests / screenshots | 69 / 10 | 69 / 10 |
| Credential pattern findings | 0 | 0; 114 text files scanned, 15 binary files skipped (including final documentation) |

**No regression found.** The credential command covers generated output, local QA text and tracked text; all six generated files are text and scanned. Binary skips are outside the six-file artifact. Pattern scanning is evidence, not a guarantee against every possible secret format. The allowlisted browser import graph and absence of credential inputs provide additional assurance. Synthetic warnings and connection-blocking CSP passed output checks; browser route/error checks retain synthetic presentation. No credentials or live data are included in the release.

The local browser harness observes requests and traps fetch, XMLHttpRequest, WebSocket, EventSource and sendBeacon attempts. It found **0 external provider/API requests**. This validates the local artifact, not future Cloudflare routing or Access configuration; hosted checks remain mandatory. Raw rerun logs/results are local in ignored `.tools/static-preview/`; baseline evidence remains in `docs/qa/static-preview/`.

## Frozen scenarios

Each direct route is `/#/lab/<id>`.

| ID | Expected decision |
| --- | --- |
| `missing-independent` | WAIT |
| `stale-token` | WAIT |
| `closed-stale-reference` | WAIT |
| `missing-multiplier` | WAIT |
| `stale-reference` | WAIT |
| `fresh-evidence` | PROCEED_TO_REVIEW |
| `missing-timestamp` | WAIT |
| `provider-disagreement` | WAIT |
| `insufficient-liquidity` | WAIT |
| `high-slippage` | WAIT |
| `market-closed` | MONITOR |
| `api-unavailable` | WAIT |

## Reproduce local validation

Run from the repository with the existing installed dependencies. These commands build/test locally and do not deploy:

```powershell
$releaseNode = (Get-Command node -ErrorAction Stop).Source # Node 24.x on PATH
& $releaseNode scripts/rehearse-static.mjs build
& $releaseNode --conditions=react-server --import tsx --test --test-concurrency=1 tests/*.test.ts
& $releaseNode --import tsx --test static-preview/model.test.ts
& $releaseNode --test static-preview/output.test.mjs
& $releaseNode node_modules/eslint/bin/eslint.js .
& $releaseNode node_modules/typescript/bin/tsc --noEmit
& $releaseNode scripts/rehearse-static.mjs browser
& $releaseNode scripts/scan-credentials.mjs static-preview/dist .tools/static-preview
Get-ChildItem -LiteralPath static-preview/dist -Recurse -Force -File | Get-FileHash -Algorithm SHA256
```

Require success for every command and exact hash/file-count/size agreement when reproducing the pinned historical source, not the newer release. The optional browser command additionally requires Playwright 1.63.0 installed under `.tools/static-browser-qa` and local Microsoft Edge; these are not installed by the root `npm ci`. Browser reruns regenerate local screenshots; preserve committed evidence before any rerun. For portable current reproduction use [the current guide](../reproduction.md).

Mode A's procedure is prepared but its account onboarding, payment acceptance and pre-upload Access gates must be verified by the owner. Mode B's procedure is prepared but public-access approval is absent. Neither mode is enabled. The [rollback procedure](OWNER-DEPLOYMENT-CHECKLIST.md#rollback--take-offline) removes hosted serving while preserving this release locally.
