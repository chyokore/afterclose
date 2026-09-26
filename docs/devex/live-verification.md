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
