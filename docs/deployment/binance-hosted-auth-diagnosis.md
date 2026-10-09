> Historical AfterClose milestone/runbook. Current release: [Cloudflare + Supabase](public-live-release.md); current judge path: [proof index](../submission/proof-index.md). Historical commands are not authorization to deploy or alter accounts.

# Binance hosted authentication diagnosis

Prompt 23, 2026-10-07. Branch `codex/binance-hosted-auth-diagnosis`, created from `f673d05daafbb082f7870ee03c05668779e3d779`. Documentation-only diagnosis; no application source, deployed package, runtime, region, CORS, cache, provider request logic or architecture changed. No merge.

## Finding and limits

**REGION_RESTRICTION: an independently documented blocker applies to the current US-hosted deployment.** Binance's [Service-Restricted Countries & Regions](https://web3.binance.com/en/dev-docs/web3-api-prohibited-regions) lists the United States, says checks are enforced at the API server, and states that server location is checked with no exemption for the listed regions except the described conditional Japan case. Netlify's deployed function metadata confirms `us-east-2` / `cmh`; its [configuration documentation](https://docs.netlify.com/build/functions/configuration/) identifies `cmh` as US East, Ohio.

This is evidence of a deployment-policy incompatibility, **not a decoded meaning of `40304`**, and not proof that credentials are irrelevant. Both hosted credential values were independently confirmed DIFFERENT from the pair that still succeeds locally. A same-pair hosted experiment was not completed. The exact cause assigned by Binance to the historical `40304` responses remains unverified.

The owner-only replacement was initially requested after local success and mismatch confirmation. Before receiving confirmation, the explicit server-location restriction was discovered and the owner was told to hold replacement. No redeploy, fresh hosted provider probe, proxy, region change or alternate hostname was attempted. A credential-only redeploy would consume credits while leaving the documented incompatibility intact. Preserve the project and seek provider-supported clarification before further hosted calls; do not bypass a regional or IP restriction.

## Local credential validation

The existing `.env.local` pair remains present. Values were never displayed, reproduced, committed or written to diagnostic files. `NODE_USE_SYSTEM_CA=1` was set; TLS verification remained enabled. The existing `scripts/test-api.ts --platforms-only` performed the first single discovery request. Only after success, the existing token and search implementations were invoked sequentially to establish discovery; no local price/market evaluation was necessary.

| Call | HTTP | Provider code | Latency | Observation timestamp, Unix ms | Provider response timestamp, Unix ms |
| --- | --- | --- | --- | --- | --- |
| platforms | 200 | 0 | 1,374 ms | 1791384665766 | 1791384665968 |
| tokens | 200 | 0 | 1,437 ms | 1791384729143 | 1791384728950 |
| search | 200 | 0 | 560 ms | 1791384729725 | 1791384729954 |

**LOCAL CREDENTIAL PAIR: KNOWN-GOOD.** NVDAon / NVDA, Ondo, BSC 56, historical contract `0xa9ee28c80f960b889dfbd1902055218cba016f75`: **MATCH**, based on current token/search results. These are local discovery results, not a hosted token-price observation. Total authenticated provider requests during this diagnosis: **three local, zero hosted**, with no retries.

## Credential parity and status

At `2026-10-07T14:53:34.004Z`, the official Netlify CLI's production/function-context values were piped into a private in-memory comparator. SHA-256 digests were compared using constant-time equality; neither values nor digest prefixes were printed or retained. Both variable results were **DIFFERENT**. The platform permits this safe retrieval; no hidden store or access restriction was bypassed.

- `BINANCE_API_KEY`: DIFFERENT.
- `BINANCE_SECRET_KEY`: DIFFERENT.
- Known-good pair installed and activated on Netlify: **not confirmed; replacement instruction put on hold; no redeployment**.
- Working local access establishes that this pair is accepted by Web3 RWA discovery endpoints at the recorded time. It does not establish every portal permission, expiration date or account status field.
- Official [authentication documentation](https://web3.binance.com/en/dev-docs/authentication) directs developers to the Web3 Developer Portal for application credentials. Ordinary Exchange API credentials must not be assumed interchangeable.
- Owner was asked for non-secret portal metadata only: active status, market/RWA access, IP allowlist presence, expiry and custom quota. No answer was available when this record was prepared. These settings remain **UNKNOWN**, not "no restriction".
- No new key, permission change or unsafe permission escalation was requested or performed.

## Hosted evidence carried forward

Existing deployment `6ac655d2243e4f735574848e` remains the deployment under investigation. It contains source `adf6b4adf741ecefd38b93c69e31e64b6a321369`, Node 24, 1024 MB, Ohio. See [the Prompt 22 record](netlify-live-gateway-record.md).

Historical four-module discovery returned HTTP 200 / provider `40304`; price and underlying-market were not called. One later tokens request returned HTTP 429 / `42900`, after which provider testing stopped. Failure receipts were genuine `UNAVAILABLE / WAIT`, with discovery `UNVERIFIED`. Seven failure receipts passed local canonical regeneration and SHA-256 verification.

No new hosted single probe or full evaluation occurred in Prompt 23. Thus hosted token price, token provider timestamp, token observation timestamp, fresh classification and live receipt digest are **not available**. The earlier verified failure digest remains `c03f485721b39cb26a0b812abcebf2e95e66b6a805f7846c330906488f4b02ab`; it must not be described as a successful live receipt.

## Redacted request-construction review

Local and packaged hosted code share `src/lib/binance/client.ts` and `src/lib/binance/auth.ts`; no differences were introduced. This is static implementation parity, not a capture of the hosted wire request with equal credentials.

| Aspect | Implementation and parity finding |
| --- | --- |
| Method/hostname | Fixed GET to the documented Binance Web3 hostname; no redirects or alternate base allowed. |
| Path | Fixed allowlisted read-only endpoint family with `/build` included; no actual authenticated URL printed. |
| Query | Both use `Object.entries` order and `encodeURIComponent` on names/values; the raw encoded form used for signing is the one sent. |
| Discovery difference | The local minimal diagnostic searches by the discovered contract; the hosted observer searches the fixed NVDA keyword. Both are documented search forms. This cannot explain a platforms rejection, since that first request has no query in either implementation. |
| Body/content type | Empty GET body; JSON response acceptance, no explicitly supplied request Content-Type. |
| Timestamp | `new Date().toISOString()`, UTC ISO 8601 with millisecond precision; not a Unix-seconds string. |
| Window | No override; documented default 5,000 ms applies. |
| Signing | UTF-8 HMAC-SHA256, then Base64; input structure is timestamp + uppercase method + raw encoded path/query + empty body. No signature or auth-header values emitted. |
| Required authentication | Key identifier, timestamp, signature; fresh random nonce supplied. Header values never retained. |
| Runtime | Node 24 on both; Node crypto checked against independent WebCrypto in the targeted test. |
| User agent | No application override; exact platform-added user agent was not captured and is not asserted identical. |

The [official authentication rules](https://web3.binance.com/en/dev-docs/authentication) support this construction. The source review and passing tests provide no evidence for `REQUEST_SIGNING_DIFFERENCE`. They do not prove full hosted wire parity.

## Clock findings

No clock was changed. No new hosted provider request was made to acquire a fresh timestamp. Existing hosted receipt A was evaluated at `2026-10-07T14:26:18.544Z`. Its four observation clocks were 70–123 ms later than the corresponding Binance response timestamps.

Using each recorded latency as a conservative request interval, the historical common possible Netlify-minus-provider clock offset is approximately **[-272, +70] ms**, assuming the provider timestamp was generated inside that interval and the two services' clocks were stable. This is far below the documented 5,000 ms acceptance window and does not support gross historical clock skew. It is an interval estimate from existing audits, **not a new measurement against an independent UTC reference**, and does not completely rule out a transient timestamp issue. Exact fresh Netlify clock skew remains unmeasured.

## IP and region

The key-specific IP allowlist is **UNKNOWN** pending owner metadata. Local success does not prove that an allowlist is absent.

[Netlify Private Connectivity](https://docs.netlify.com/manage/security/private-connectivity/) documents fluctuating default outbound IPs. Its static-IP option is an Enterprise add-on requiring the stated high-performance product. **Netlify Free does not provide that stable-egress feature.** If the owner key requires a fixed allowlist, that would be a separate architecture limitation; the premise is not established here. No paid egress was purchased or recommended as an automatic fix.

Region result: **DOCUMENTED RESTRICTION**. The official Binance prohibited-region page explicitly covers server locations, so its US restriction is relevant to the verified Ohio function. No inference from error-number similarity is needed. Do not change regions to evade policy; first obtain provider-supported clarification about permissible hosting for an eligible developer.

## Error research

**40304 OFFICIAL MEANING NOT FOUND.** Searches targeted official Binance Web3 documentation, Binance Developer documentation, Binance Support and official hackathon material. The reviewed [Market API error reference](https://web3.binance.com/en/dev-docs/products/market-api/error-codes), [Wallet API error reference](https://web3.binance.com/en/dev-docs/products/wallet-api/error-codes) and authentication table list other auth/compliance codes but do not define `40304`. This is a bounded search finding, not proof that no unpublished or unindexed definition exists. No random blog or community speculation is treated as authoritative.

**42900:** the official Market API error reference identifies rate limiting. The authentication page documents these default concurrent limits:

| Dimension | Default | Window |
| --- | --- | --- |
| Source IP | 1,200 requests | 60 seconds |
| API key | 1,200 requests | 60 seconds |
| User | 6,000 requests | 60 seconds |
| Endpoint | 5 requests/second | 1 second |

The documented response includes `Retry-After` in seconds. The previous receipt did not retain that header, so its exact cooldown and triggered dimension cannot be recovered. Do not infer the original key's actual quota from these defaults; no RWA-specific override or owner custom quota was established. The application's 60-second failure cache is not a Binance-prescribed cooldown. No additional 429 was intentionally triggered.

## Hackathon context

The [official Tokenized Stocks event page](https://www.bnbchain.org/en/hackathons/tokenized-stocks) directs entrants to the Web3 Developer Portal, offers free event API access and possible elevated limits through registration. The [organizer's launch article](https://www.bnbchain.org/en/blog/bnb-hack-tokenized-stocks-edition-with-binance-web3-wallet) also describes API-service registration. These materials establish use of Web3 developer credentials and event registration; they do **not** establish a separate required gateway, a special interchangeable key type, or an exact team-to-key binding process. No such requirement was invented. Owner enrollment/custom entitlement remains unknown. The event's eligibility restrictions do not alone establish an egress rule; the separate API server-location policy does.

## Validation, security and next action

- Targeted auth/signing, gateway and live-deployment boundary tests: **42 passed**, zero failures/skips. Tests use mocks, not provider traffic. Unrelated suites were not rerun because application source is unchanged.
- No credential value, signature, authenticated URL, authentication-header value or fingerprint was printed, committed or saved. Only MATCH/DIFFERENT comparison labels were retained.
- Final exact-value scan against the local pair: **201 files, including binary files, zero findings**. Prompt 22's hosted artifact scans remain historical evidence, not a new post-replacement scan. No replacement/redeployment was completed by this diagnosis.
- Netlify diagnosis deployment credits: **0**; gateway requests: **0**. The last measured balance was 285/300; no new balance is claimed and unrelated service usage could change it.
- Cloudflare unchanged. Existing Netlify project preserved. No other host/project, paid resources, wallets, wallet signing, simulation or broadcast.
- Root classification: **REGION_RESTRICTION (documented independent blocker)**. Credential discrepancy is also confirmed; `CREDENTIAL_MISMATCH_RESOLVED` and same-credential `PROVIDER_POLICY_UNKNOWN` are not established.
- Remaining work requires provider-supported clarification of the documented US server restriction and `40304`, plus owner-only portal metadata. No messages were sent to support. No new key is justified by current evidence. No integration, redeploy or region change is performed under this finding.

**BINANCE HOSTED AUTH STILL BLOCKED — REVIEW REQUIRED**
