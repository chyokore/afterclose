# Netlify live gateway deployment record

Prompt 22, 2026-10-07. **DEPLOYED, LIVE EVIDENCE BLOCKED — REVIEW REQUIRED.** The function runs and fails closed, but hosted Binance calls returned non-zero provider codes. This is not ready for Cloudflare integration. Cloudflare and Render remain unchanged.

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

All 169 tests, gateway/static/prototype builds, lint, TypeScript and credential scans passed before retrying. The compatibility commit is the commit introducing this record; hosted results below identify the exact deployed source commit.

## Deployment completed

- Branch: `codex/zero-cost-live-gateway`; deployed source: `adf6b4adf741ecefd38b93c69e31e64b6a321369`, committed and pushed clean before deployment. The only source correction was the Free-plan memory override described above.
- Bundle source fingerprint: `59fa5fefc5035778bf72547d0955483923504dcf9066241e885e527eb24701f4`; hosted response reports `dirty: false` and the exact source commit. Later documentation commits are not additional deployments.
- Credential-free draft `6ac650403535125fdef7cf98`: one function, starts successfully, canonical receipt verifies, expected `503 / configuration / WAIT`. Public visibility enabled for this project. No provider calls during that packaging check.
- Owner confirmed private secret entry. Production function scope/context exposes only the expected five variable names: `AFTERCLOSE_DEPLOYMENT_MODE`, `NODE_ENV`, `AWS_LAMBDA_JS_RUNTIME`, `BINANCE_API_KEY`, `BINANCE_SECRET_KEY`. No public-prefixed secrets. No values in this record.
- **One production deployment:** `6ac655d2243e4f735574848e`; CLI started `2026-10-07T14:22:47.085Z`, returned success `14:23:39.075Z`. Netlify created it at `14:23:14.559Z`, published at `14:23:30.105Z`, and reports deployment time 15 seconds.
- Public endpoint: <https://afterclose-live.netlify.app/api/live-evidence>. It requires the exact allowed Origin; opening directly without that header correctly returns 403.
- Immutable deployment: <https://6ac655d2243e4f735574848e--afterclose-live.netlify.app>.
- Netlify deployment API confirms `live-evidence`, `nodejs24.x`, default 1024 MB, `us-east-2` / `cmh`, function size **476,481 bytes**, exact `/api/live-evidence` route. Local bundled library was 491,136 bytes. The dashboard lists 788 bytes of deploy files (150-byte index plus platform configuration), separately from the function.
- Runtime packages, canonical engine and SHA-256 work. No missing modules; no React/Next runtime in the gateway bundle. The public index contains Netlify's injected HUD script; that JavaScript was also fetched and scanned.

## Hosted provider result and captured observation

Seven controlled evidence requests were made: A/B/C/D plus one burst of three. **All returned HTTP 503, `LIVE_EVIDENCE_UNAVAILABLE`, reason `provider`, discovery `UNVERIFIED`, token evidence `UNAVAILABLE`, complete evidence `UNAVAILABLE`, engine `WAIT`.** No synthetic replacement was used.

Captured hosted observation A was evaluated at **2026-10-07T14:26:18.544Z**. No token identity or token price was obtained. Token-price provider timestamp, observation timestamp and age are therefore **unavailable**, not zero. Historical NVDAon identity cannot be reported as MATCH.

| Module | HTTP | Provider code | Latency | Provider response timestamp (UTC) | Netlify observation timestamp (UTC) |
| --- | --- | --- | --- | --- | --- |
| platforms | 200 | 40304 | 362 ms | 14:26:18.397 | 14:26:18.472 |
| tokens | 200 | 40304 | 400 ms | 14:26:18.400 | 14:26:18.523 |
| search | 200 | 40304 | 346 ms | 14:26:18.397 | 14:26:18.470 |
| chain-list | 200 | 40304 | 342 ms | 14:26:18.397 | 14:26:18.467 |
| price | Not called | Discovery failed | — | — | — |
| underlying-market | Not called | Discovery failed | — | — | — |

All dates above are 2026-10-07. A provider response timestamp is not a token-price update timestamp. TLS and HTTP connectivity worked; successful Binance authentication/authorization was **not established**. A later burst evaluation also received HTTP 429 / `42900` on tokens; further provider requests stopped. No retry loop, proxy, region change, alternate provider domain or weakened TLS was used.

Binance's [official Web3 error reference](https://web3.binance.com/en/dev-docs/products/wallet-api/error-codes) confirms non-zero codes mean failure and documents `42900` as rate limiting. The inspected reference does **not** define `40304`; its exact cause remains unresolved. Do not infer a specific region, signature or key-permission failure from the code alone.

A private in-memory comparison found both hosted values differ from the locally validated pair; both local values are present and hosted values are neither masked nor padded with outer whitespace. This is a diagnostic finding, not proof of the rejection's cause. Owner clarification was requested without asking for values. No credentials were changed by the agent, and no second production deployment was attempted.

Actual blocker codes (unique): `API_UNAVAILABLE`, `MISSING_EVIDENCE`, `MISSING_LIQUIDITY`, `MISSING_QUOTE`, `MISSING_CORROBORATION`, `GAP_UNAVAILABLE`. The receipt contains six distinct findings with `MISSING_EVIDENCE`.

## Receipt integrity and equivalence

All seven hosted receipts passed `verifyReceipt`, including full canonical JSON reconstruction and SHA-256 verification. Rebuilding from the identical normalized observation, evaluation time and included calendar review using local `createEvidenceReceipt` produced the identical digest for each response. This verifies genuine failure receipts, not successful live evidence.

- Schema: `afterclose-evidence-receipt/v1`.
- Engine: `reference-truth/v1:0b8daa72d38484ed6c6e4ea5e89213029c3c47f97bfcccdca6a7aa67e6cc669b`.
- Captured A digest: `c03f485721b39cb26a0b812abcebf2e95e66b6a805f7846c330906488f4b02ab`.

## Cache, coalescing and performance

| Request | HTTP | Client latency | Bytes | Latest audit age at evaluation |
| --- | --- | --- | --- | --- |
| A, first provider evaluation | 503 | 1,716.45 ms | 10,547 | 21 ms |
| B, immediate repeat | 503 | 934.42 ms | 10,555 | 1,112 ms |
| C, inside 30 seconds | 503 | 934.40 ms | 10,555 | 6,121 ms |
| D, about 38 seconds after A | 503 | 1,131.87 ms | 10,559 | 38,278 ms |

B/C/D retained A's exact four audits and original observation clocks while evaluation time advanced. Failure cooldown is **60 seconds**, so D correctly did not refresh after 30 seconds. Successful 30-second caching cannot be verified without successful provider evidence. After failure-cache expiry, the later burst produced fresh audit timestamps.

Three concurrent client requests yielded **two distinct audit sets**, one shared by two responses. Inferred provider work: A = four requests; B/C/D = zero new; burst = two evaluations / eight requests, totaling **12 audited provider requests**. These counts are inferred from unique endpoint/observation audits, not a global provider-side counter. Cache and in-flight coalescing are per instance; serverless distribution prevents a global one-evaluation guarantee. Hosted in-flight sharing specifically cannot be distinguished from an immediate per-instance cache hit. Local deterministic coalescing tests pass, but global hosted coalescing does not.

The first production function invocation was the rejected-origin preflight: **1,301.71 ms** client latency. First provider evaluation A was **1,716.45 ms** after the function was already warm. B/C warm cached median was **934.41 ms** client latency. Function logs report approximately 7/12 ms for B/C; client timings include network and platform overhead. A separately identifiable cold-initialization penalty was not exposed, so these are not claims of isolated cold-start duration. No cold starts were deliberately forced.

No successful live-response size is available. Failure responses were 10,547–10,559 bytes, smaller than the previous local successful ~12.7 KB result; this reflects absent evidence, not an optimization.

## Boundaries and security

- Exact allowed Origin receives matching `Access-Control-Allow-Origin`, never wildcard. Two unrelated origins and production localhost receive 403 with no allow-origin header.
- POST, PUT, DELETE and OPTIONS receive 405. Arbitrary asset, contract, chain, URL, endpoint and malformed query receive 400. An Authorization header receives 400. These reject before provider access.
- Final additional checks: the default `/.netlify/functions/live-evidence` alias returned 404, absent Origin returned 403, and a Content-Type header returned 400; none invoked Binance.
- Public server library, function entry, source map, `.env`, `.env.local` and `netlify.toml` paths returned 404. Index and Netlify HUD are the retrievable browser assets examined.
- Actual hosted secret values were used only in memory for a final scan of **256** tracked source/documentation and artifact/log/package files, including binary files: **zero exact matches**, including encoded representations. A separate scan against the locally validated credentials covered **252** source/artifact files with zero matches. Public assets, captured failure receipt and logs also had zero credential-name/auth-header/signed-request pattern findings. No environment dump was displayed or saved.
- Deployment/function logs contain platform duration/memory records and the sanitized endpoint/status warning for tokens 429. No raw signed request or secret-bearing provider error was retained.
- Browser/provider credential exposure: none observed. Requests to Binance originate in the deployed function; no browser Binance client was deployed. CORS is a browser read boundary, not caller authentication; non-browser callers can supply Origin. Existing per-instance quotas do not provide global rate limiting.
- Existing validated mocks cover timeout, non-zero provider code, malformed response, missing price, stale evidence and reflected secrets; results remain fail closed. Production secrets were never intentionally corrupted for testing.

## Cost and validation

Post-test actual Netlify billing UI: **Free / $0.00**, **15 credits consumed**, **285/300 remaining**. One production deploy accounts for 15 credits. Web requests, compute and bandwidth each display **less than 1 credit**; total and remaining values are rounded and the UI warns ingestion may lag. The visible traffic counter was 17 and is not a complete request count. No card saved, invoices, paid charges, purchased domains, extra resources or upgrades.

The compatibility correction passed all **169 tests** (147 TypeScript, 3 gateway package/frontend, 15 static-model, 4 static-output), lint, TypeScript and gateway/static/prototype builds before deployment. No application source changed after that validation. Hosted checks add the results above. Git remains on the deployment branch; no merge or protected-branch update.

## Integration hold and next step

**Do not connect Cloudflare yet.** The future non-secret value would be `PUBLIC_LIVE_GATEWAY_URL=https://afterclose-live.netlify.app/api/live-evidence`, but it is not approved as a verified integration target. Resolve the credential-pair discrepancy privately and obtain provider-supported clarification for `40304`. Any corrected environment requires a separately authorized redeployment because Prompt 22's one production deployment has been consumed. Then rerun bounded hosted live-evidence verification after provider access is valid. Do not work around any provider restriction.

The deployed gateway remains fail closed; there is no recurring polling job. Existing static preview <https://afterclose-preview.pages.dev/> is unchanged. Wallet, wallet signing, transaction simulation and broadcast: **NONE**. Read-only API request authentication is distinct from wallet signing.
