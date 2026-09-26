# API observations — September 26, 2026

Official sources consulted:

- [Authentication](https://web3.binance.com/en/dev-docs/authentication)
- [RWA Data](https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/rwa-data)
- [Documentation entry](https://web3.binance.com/en/dev-docs) (entry fetch failed; linked pages above were accessible)

Authentication uses an ISO UTC timestamp, uppercase method, exact encoded path including `/build` and query, and empty GET body. HMAC-SHA256 output is Base64. Required headers are X-OC-APIKEY, X-OC-TIMESTAMP and X-OC-SIGN. The client also sends a nonce.

| GET endpoint suffix under `/api/v1/dex/market/rwa/` | Implemented parameters | Live outcome |
| --- | --- | --- |
| platforms | none | Diagnostic skipped: missing credentials |
| tokens | binanceChainId=56 | Diagnostic skipped: missing credentials |
| search | keyword from discovered contract | Diagnostic skipped: missing credentials |
| price | binanceChainId=56, tokenContractAddresses | Diagnostic skipped: missing credentials |
| underlying-market | binanceChainId=56, tokenContractAddress | Diagnostic skipped: missing credentials |

The documented envelope contains code, success, data and server timestamp. Runtime validators check the fields actually consumed. No real response schema has yet been observed. The diagnostic prints validated field shapes, not complete raw payloads.

The documentation defines referencePrice as a per-share conversion from token pricing, not an independent stock-exchange quote. tokenPriceUpdatedAt concerns the token; the envelope timestamp concerns the server response. No underlying-reference timestamp is documented. Actual responses remain unverified. Do not substitute retrieval time, token-update time or market opening time for reference freshness.

Contract selection requires chain 56, stock asset type and ondo/bstock issuer. API discovery and identity matching establish provider support, not independent issuer attestation or an on-chain audit. Neither can be claimed today.
