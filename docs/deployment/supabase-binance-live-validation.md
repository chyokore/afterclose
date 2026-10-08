# Supabase Frankfurt Gate B validation

Status: IN PROGRESS — local authentication and fresh credential-free regional checks passed; waiting for owner-only secret entry. No hosted Binance request has occurred. No Gate B success is claimed.

Branch `codex/supabase-binance-live`, base `1fc758cdf744e0e767e4ee2d8a037632cae23f4c`. Project `afterclose-frankfurt` (`wakuqrnxjwikvlrxgezg`). Cloudflare and Netlify unchanged.

## Local credential precheck

One actual authenticated `platforms` call on 2026-10-08: HTTP 200, provider code `0`, latency 1,935 ms. Observation timestamp `1791490637692`; provider response timestamp `1791490638589`; check completed `2026-10-08T20:17:17.697Z`. TLS verification stayed enabled using the system CA store. Credentials were read solely inside the existing local process; no values, signed URLs or auth headers were emitted.

The first script attempt failed in TypeScript/CommonJS environment-loader interop **before any provider call**. A separate no-network setup check established this, then the import was corrected using `createRequire`. There was exactly one actual local provider request, not a retry of a failed authentication request.

## Fresh region precheck before secret entry

One credential-free diagnostic invocation at `2026-10-08T20:21:09.288Z` returned HTTP 200. Runtime `SB_REGION` and `x-sb-edge-region` both reported `eu-central-1`. Both geolocation services observed the same new IPv6 address `2a05:d014:61b:270b:3183:7076:2940:544e`:

- IPWhois: DE, Hessen, Frankfurt am Main, ASN 16509, Amazon Data Services Ireland Ltd; 30.50 ms outbound.
- ipapi: DE, Hesse, Frankfurt am Main, AS16509, Amazon.com, Inc.; 240.88 ms outbound.

Total diagnostic latency: 2,306.68 ms. Classification: observed VERIFIED_NON_US, Germany. The address changed since Gate A, reinforcing that historical egress is not permanent proof. Today's [Binance prohibited list](https://web3.binance.com/en/dev-docs/web3-api-prohibited-regions) does not list Germany; this is not a guarantee of API access or account eligibility.

Temporary diagnostic used the existing credential-free Gate A adapter, with zero Binance calls. Removal was verified at `2026-10-08T20:23:58.552Z`: HTTP 404, `DIAGNOSTICS_DISABLED`, runtime Frankfurt. Retained deployed commit `4bfb29849ce4ba3a1b9363eaf5862daeefa30813`, source digest `6aac02b067cfd70b2123174e49617403009ef650644c3affe119fb5baeb89bfa`. The adapter remains locked: adding secrets alone cannot trigger Binance requests. Secret-name inspection before handoff showed no custom secrets. ESLint and TypeScript passed for the precheck addition.

## Owner handoff and remaining work

Required private secret names: `BINANCE_API_KEY`, `BINANCE_SECRET_KEY`. Owner must obtain both values from the same secure local configuration validated above, enter them directly in Supabase, and confirm completion. Never send values to chat, Codex output, documentation or source. Verify names only afterward.

Pending: owner confirmation; restricted Gate B adapter; one hosted minimal probe; only on code `0`, one optimized full evaluation; receipt/local equivalence; cache verification; hosted CORS/security/usage checks; final sanitized report. Stop on probe failure without retries. No frontend integration, wallet, signing, transaction simulation, new database or paid service is authorized.
