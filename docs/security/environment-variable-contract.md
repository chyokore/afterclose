# Environment-variable contract
Audit date: 2026-10-09. Names only; owner values are never printed. Scope: tracked and new source, scripts, tests, configuration, examples and deployment docs; ignored credential inputs are inspected only by in-memory scanners. Current public frontend requires no environment variables. Historical host markers below are retained for the local Next.js application and older AfterClose rehearsals, not instructions to configure the current static site.

| Names | Classification | Contract |
|---|---|---|
| BINANCE_API_KEY, BINANCE_SECRET_KEY | SECRET SERVER ONLY | Runtime authentication and local in-memory leak comparison. Server-only imports. Never NEXT_PUBLIC, props, receipts, browser requests, logs or build child environment. |
| AFTERCLOSE_DEPLOYMENT_MODE | NON-SECRET SERVER | Explicit allowlist; production must be configured. Conflicts and unknown values disable provider access. |
| AFTERCLOSE_PREVIEW_MODE | NON-SECRET SERVER | Legacy synthetic rehearsal guard. Leave absent for competition live. Never an override of failed production configuration. |
| BINANCE_WEB3_BASE_URL | NON-SECRET SERVER | Optional legacy setting; only exact approved Binance origin/path accepted. Leave absent on host. |
| NODE_ENV | NON-SECRET SERVER | Framework runtime detection; production server sets production. |
| SB_REGION | HOST-SUPPLIED SERVER | Supabase's runtime region; the gateway rejects any value other than eu-central-1 before provider work. Do not spoof or set it manually. |
| RENDER, VERCEL, VERCEL_ENV, NETLIFY | HOST-SUPPLIED SERVER | Legacy Next.js host detection and local-gateway origin restrictions. Not required by Pages/Supabase. |
| NODE_VERSION, PORT | HISTORICAL HOST CONFIGURATION | Runtime selection and listening port in older Node-host runbooks. Not current Pages/Supabase application inputs. |
| NEXT_TELEMETRY_DISABLED | NON-SECRET SERVER | Build/runtime telemetry control. |
| NODE_USE_SYSTEM_CA | LOCAL ONLY | Existing local system trust integration when required by Node. Does not disable certificate validation; not a hosted runtime setting. |
| NODE_OPTIONS, AFTERCLOSE_NETWORK_AUDIT | LOCAL ONLY | Test/build preload and audit path; no production override flags. |
| PATH, PATHEXT, SystemRoot, WINDIR, TEMP, TMP, COMSPEC | LOCAL ONLY | OS process bootstrap allowlist for isolated builders; no environment wholesale copy to builder. |
| CI, WRANGLER_SEND_METRICS, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV, XDG_CONFIG_HOME | LOCAL ONLY | Existing Cloudflare rehearsal tooling only. No Cloudflare changes. |
| NODE_TLS_REJECT_UNAUTHORIZED | UNUSED | Prohibited TLS bypass; not set or consumed by application. |

SAFE PUBLIC: none required. Build commit/source digest and engine identity are generated non-secret constants, not environment dumps.

## Boundaries
Credentials accept bounded ASCII syntax only; syntactic validity does not establish provider authorization. Missing or malformed values produce setup/unavailable evidence before any Binance or issuer call. Missing/invalid deployment mode produces configuration/unavailable, never fixtures. Scenario Lab stays explicitly synthetic and separately accessible.
Signing is HMAC API request authentication only, unrelated to wallet signing. Fixed GETs cannot broadcast or execute transactions. Redirects fail; no arbitrary URL/endpoint/method/parameter route exists.
Provider responses are bounded, schema-projected, and rejected if they reflect configured credential values. Errors retain enumerated categories; raw provider bodies and exception text are discarded. Snapshot read/write rejects reflected credentials.
Exact-value scans cover UTF-8, UTF-16, URL encoding and base64 in memory; pattern scans and client-boundary name/header scans complement them. Source code necessarily names secrets on the server; those names are prohibited in browser artifacts. Counts only are published. Scanning cannot prove absence of every hypothetical encoding or a compromised hosting administrator.
