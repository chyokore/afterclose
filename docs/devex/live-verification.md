# Live connectivity attempt — September 26, 2026

## Environment and scope

Confirmed origin is `https://github.com/chyokore/afterclose.git`, starting from commit `c8ceff90a0efc181a01561d0e7011581889d4c01`. Working tree was clean. `.env.local` exists, is ignored and contains nonempty API key and secret. Checked only booleans using Next.js environment loading; values were never printed. No Noctive resources were accessed.

The existing server-only client was used with the configured credentials and the official fixed host. Added sanitized response auditing: HTTP status when available, total request latency, numeric provider code, response timestamp, and allowlisted transport error codes. No auth headers, signatures, raw errors or arbitrary provider messages are logged.

## Actual requests

The first platforms request failed before receiving an HTTP response. A diagnostic retry measured 10,763 ms with `UND_ERR_CONNECT_TIMEOUT`. The final `npm run test:api` run returned exit code 1:

| Endpoint under `/api/v1/dex/market/rwa/` | Parameters | Outcome | Latency | HTTP status |
| --- | --- | --- | --- | --- |
| platforms | none | UND_ERR_CONNECT_TIMEOUT | 10,838 ms | None received |
| tokens | binanceChainId=56 | ENOTFOUND | 403 ms | None received |
| search | keyword=NVDA | UND_ERR_CONNECT_TIMEOUT | 10,233 ms | None received |
| price | Not sent | Skipped: no API-discovered BSC contract | N/A | N/A |
| underlying-market | Not sent | Skipped: no API-discovered BSC contract | N/A | N/A |

NVDA was only a search keyword; no support, contract or quote was assumed. Search does not document a chain filter; token selection remains restricted to chain 56.

## Diagnosis and limitations

An unauthenticated PowerShell transport probe to the same endpoint also failed. Windows DNS lookup timed out, and Node DNS lookup returned ENOTFOUND. No HTTP proxy environment variable was configured. These observations establish local reachability failure, not invalid credentials. No Binance 401/403, error payload or successful authentication response was received. The precise network root cause is unresolved.

No actual market response schema, issuer, token name/symbol, contract, company, decimals, multiplier, price or timestamp was discovered. No MVP stock has been selected. Documented timestamp semantics remain documentation evidence only: tokenPriceUpdatedAt is token freshness; the envelope timestamp is server response time. The documented reference is token-derived, and no independent underlying quote timestamp is documented.

## Product and follow-up

The page now explains network/DNS failure and shows setup required / connection unavailable, withholding all market data. Existing missing-credential handling remains. No transaction functionality was added.

User action: restore DNS/HTTPS reachability to `web3.binance.com` on this computer/network, then rerun `npm run test:api`. Credential rotation is not indicated by the evidence. Do not send secrets in chat. After successful responses, audit actual fields and verify an issuer-supported BSC stock before choosing the MVP asset.

AI assistance: Codex verified environment flags, consulted official docs, made the recorded read-only attempts, diagnosed sanitized transport errors, updated diagnostics/UI and wrote this evidence log. No invented provider response or user experience is included.

## Validation

`npm test`: 3 passed, 0 failed. `npm run lint`: passed. `npm run build`: passed with .env.local loaded. The 401 line in unit-test output is a synthetic response, not a real Binance rejection.

Production preview on 127.0.0.1:3001 was checked in the browser. Initial navigation timed out while server requests completed; reading the loaded page afterward confirmed setup required / connection unavailable, the DNS guidance, and no token prices. These page requests also failed at the network layer; no additional live data was obtained.

Live connectivity remains a separate failed check; local validation does not establish authentication.

## Network isolation follow-up — September 26, 2026

Started at the requested commit `26814c3fd9a9f0be883d3a929f994771f7300fbc`; confirmed AfterClose origin and a clean working tree. No application code, credentials, API base URL or network settings changed.

| Diagnostic | Actual result |
| --- | --- |
| `nslookup web3.binance.com` | Configured private DNS resolver timed out repeatedly; no address returned. Resolver address omitted from this public diary. |
| `Test-NetConnection web3.binance.com -Port 443` | Name resolution failed; no remote address. This does not establish that TCP port 443 is blocked. |
| `curl.exe -I --max-time 15 https://web3.binance.com/en/dev-docs` | Exit 6: Could not resolve host. No TLS handshake or HTTP status obtained. |
| Node `dns.lookup`, three sequential attempts | ENOTFOUND each time; 11,103 ms, 11,105 ms and 11,079 ms. No successful resolution observed. |
| Node HEAD to official documentation, 15-second abort limit | UND_ERR_CONNECT_TIMEOUT after 11,181 ms; no HTTP response. This timeout alone does not distinguish DNS from TCP. |
| Codex in-app browser, same official documentation URL | Navigation initially timed out; browser error page reported ERR_NAME_NOT_RESOLVED and that the server IP address could not be found. Browser and Node both failed resolution; no browser-only success. |

Proxy checks returned only configuration flags, never values. HTTP_PROXY, HTTPS_PROXY, ALL_PROXY, NO_PROXY and NODE_USE_ENV_PROXY were absent at process, user and machine scopes. Windows Internet Settings showed explicit proxy disabled, no proxy server and no PAC URL. AutoDetect registry value was absent, so automatic discovery was not conclusively determined. WinHTTP reported direct access.

**Established failure stage:** hostname resolution. TCP connectivity, TLS validation and HTTP/API behavior remain unassessed because DNS did not supply an address. This is not an API authentication rejection. No provider 401/403 or error body was received. The root cause of the DNS failure (resolver outage, routing, upstream resolution, or network policy) is not established by these tests.

HTTPS was not restored, so `npm run test:api` was not repeated in this follow-up. No new RWA response, BSC contract, price or timestamp was obtained. Credentials were neither rotated nor exposed. No Noctive resources were accessed and no trading functionality was added.

**Next diagnostic action:** compare `nslookup web3.binance.com` with a known-working hostname on the same configured resolver, then ask the network administrator to check resolver reachability and its response for the Binance hostname. A comparison on another user-approved network can isolate the current network without permanently changing DNS settings. No such comparison or network change was performed in this run.

AI assistance: Codex ran the requested read-only network tests, compared Node and browser failures, inspected sanitized proxy flags and recorded these findings. Follow-up validation: `npm test` passed all 3 tests; `npm run lint` passed; `npm run build` passed. The test log containing HTTP 401 is synthetic, not an observed provider response. Only this diary file changed.
