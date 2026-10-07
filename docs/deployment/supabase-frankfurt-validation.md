# Supabase Frankfurt Gate A validation

**GATE A PASS — observed egress VERIFIED_NON_US. Gate B is not authorized.**

Completed 2026-10-07. Branch `codex/supabase-frankfurt-validation`, base `4e610ba410bc174da26198d5834ebd2b35afcfc5`. See [machine-readable evidence](supabase-frankfurt-evidence.json). One project and one function exist; two revisions were deployed to remove temporary diagnostics after testing. No merge or frontend integration.

## Account, costs and resources

Actual dashboard evidence confirms organization AfterClose (`fqahaejvrdizirhdbuan`) is Free. Creation offered $0/month, required no payment entry, and the organization currently limits usage rather than billing overages. Billing displays Spend Cap enabled and explicitly states no extra usage charges. This observed UI wording differs from the public documentation's description of the named Pro cap; no paid plan was selected to obtain protection.

Project `afterclose-frankfurt`, reference `wakuqrnxjwikvlrxgezg`, uses the included Nano instance (`t3.nano`). Owner entered the required database password privately. No paid compute, storage, dedicated IP, domain, networking, add-on, subscription or additional project was purchased. No card was entered or requested during this workflow. Payment and invoice details did not fully populate in the dashboard capture; the confirmed Free plan and explicit no-overage message are the financial evidence, not a claim to have audited an invoice ledger.

Data API was disabled during setup. No application tables, migrations, storage objects or gateway database calls were added. Baseline database usage was 26 MB; post-validation summary remained 0.026 / 0.5 GB (detail 24.82 MB). This is included platform infrastructure, not a gateway data store.

Post-validation usage page: Free, quota not exceeded, 0 / 500,000 invocations and 0 / 5 GB egress displayed, with explicit hourly reporting delay (charts may lag 24 hours). These zeros are delayed counters, **not zero actual consumption**. The controlled scripts made 26 function requests: 13 initial checks, 12 retained-version checks, and one disabled-diagnostic check. Exactly two outbound IP/geolocation requests occurred. The request allowance would have 499,974 remaining from these checks alone; dashboard/account totals may include other activity. Egress bytes are not yet accurately metered; no fabricated byte total is reported. No paid charges or paid resources were incurred by this workflow.

## Deployment and runtime

Function URL: `https://wakuqrnxjwikvlrxgezg.supabase.co/functions/v1/live-evidence?forceFunctionRegion=eu-central-1`.

Diagnostic source commit `9e0e9dec2d1611d9938625ddcab2eaf97ac30802`, digest `3978ecc3895dd471f5b25f6bb1396d2caccfc623c40cbcc917d88db91433d8f3`, 504,617 bytes. Initial deployment occurred 2026-10-07 before the 18:58:36 UTC verification; exact initial platform creation timestamp was not captured.

Retained source commit `2991ae70446f2d1753ea91be70f506fd861f2946`, digest `6aac02b067cfd70b2123174e49617403009ef650644c3affe119fb5baeb89bfa`, 493,744 bytes. Final verification and exact times are in the evidence JSON; final audit completed 19:06:27 UTC. Both builds were clean and their hosted identities matched. Later documentation commits do not change the deployed bundle.

Runtime reports `Supabase Edge Runtime / Deno supabase-edge-runtime-1.77.0 (compatible with Deno v2.1.4)`. No Next/React runtime, Scenario Lab or source maps. Only explicit Node built-ins remain external. Owner explicitly authorized disabling legacy JWT verification for this one read-only function. No Supabase key was supplied by a browser or test script.

## Four distinct geography signals

| Layer | Evidence |
|---|---|
| Project region | Dashboard: Central EU (Frankfurt), `eu-central-1` |
| Invocation routing | Explicit `forceFunctionRegion=eu-central-1`; response `x-sb-edge-region=eu-central-1` on all 25 main verification requests |
| Runtime region | Trusted `SB_REGION` reads `eu-central-1`; exposed as safe diagnostic metadata |
| Outbound origin | Two independent HTTPS services observed the same public IPv6 address in Frankfurt, Germany |

Observed egress IP: `2a05:d014:61b:270a:57e9:668e:971:b22e`.

| Source | Country | Region / city | ASN / organization | Outbound elapsed |
|---|---|---|---|---:|
| [IPWhois](https://ipwhois.io/documentation), `https://ipwho.is/` | DE | Hessen / Frankfurt am Main | 16509 / Amazon Data Services Ireland Ltd | 80.14 ms |
| [ipapi](https://ipapi.co/api/), `https://ipapi.co/json/` | DE | Hesse / Frankfurt am Main | AS16509 / Amazon.com, Inc. | 219.18 ms |

Classification: **VERIFIED_NON_US under Prompt 25's multiple-converging-signals criterion**. Corporate organization names are not country evidence; both country fields explicitly reported Germany. These are observations of two connections, not a contractual jurisdiction guarantee, a permanent IP, or proof of IPv4/destination-specific routing. Future instances and Binance's own geolocation may differ. [Supabase regional invocation](https://supabase.com/docs/guides/functions/regional-invocation) documents metadata and routing; project location alone never proved egress.

Observed region: Germany. [Current Binance prohibited list](https://web3.binance.com/en/dev-docs/web3-api-prohibited-regions), rechecked 2026-10-07: **NOT LISTED**. This does not guarantee API access or account eligibility. No attempt was made to bypass client-location restrictions. Historical `40304` remains unexplained.

## Safety, runtime checks and equivalence

The Gate A adapter always generates canonical unavailable evidence, regardless of credential configuration. It never calls the market observation pipeline. The entry point additionally permits fetch only to the two fixed geolocation destinations with redirects rejected. `SB_REGION` must equal Frankfurt before any diagnostic activity; otherwise it returns `HOST_REGION_UNVERIFIED`. Unknown region strings are not echoed.

Both hosted normal responses returned HTTP 503, `LIVE_EVIDENCE_UNAVAILABLE`, reason `configuration`, a valid canonical receipt and engine WAIT. This is expected success for credential absence, not a crash.

Hosted normalization/schema parsing, deterministic JSON, Node SHA-256, WebCrypto known-answer SHA-256, timestamp conversion, AsyncLocalStorage, AbortSignal timeout, cache coalescing/cooldown, and actual outbound fetch all passed. Runtime outputs were deep-equal to local outputs, including canonical JSON strings and SHA-256 digests.

| Fixed engine test vector | Hosted/local decision | Equality |
|---|---|---|
| Stale reference | WAIT | PASS |
| Market closed | MONITOR | PASS |
| Fresh evidence | PROCEED_TO_REVIEW | PASS |
| Provider unavailable | WAIT | PASS |

Canonical receipt equivalence: configuration-unavailable and provider-unavailable receipts matched byte-for-byte and by digest. The current live receipt intentionally cannot produce MONITOR/PROCEED_TO_REVIEW without independent evidence. Those requested decision cases were tested at the unchanged engine boundary, **not fabricated as live Evidence Receipts**. This is the explicit scope qualification on receipt coverage. No canonical semantics were changed to obtain a passing result.

Temporary test vectors were labelled runtime validation, never market evidence. The retained build excludes them. `/diagnostics` now returns HTTP 404, `DIAGNOSTICS_DISABLED`; no retained request can trigger the diagnostic. No transaction simulation was performed.

75 targeted local tests passed; five adapter tests passed again after type-only corrections. TypeScript and ESLint passed. Canonical engine, receipt and normalization source remain byte-unchanged. An initial sandbox test rerun hit a local Node ENOMEM startup issue; the authorized rerun passed all five tests.

## CORS and abuse controls

Hosted allowed origin `https://afterclose-preview.pages.dev` received exact CORS. Two unauthorized origins returned 403 without an allow-origin header. Wildcard absent. POST/PUT/DELETE returned 405. Arbitrary asset, contract, chain, URL and endpoint queries returned 400. Local tests additionally covered wrong/missing/prohibited runtime regions, duplicate/foreign region parameters, OPTIONS, Authorization/Content-Type rejection and zero fetch on rejected requests. No generic proxy capability exists.

The function uses a per-instance 120/minute limit; this is not a global abuse quota. CORS is a browser control, not authentication. No public market data, secrets or provider access is enabled in Gate A.

## Latency

End-to-end from the owner's machine, not server-only duration: first successful credential-free invocation 2,179.59 ms; immediate follow-up 1,052.15 ms; diagnostic request 593.70 ms. The follow-up is operationally warm but not guaranteed to reuse the same isolate. Retained-version first/follow-up: 1,895.97 / 1,168.31 ms. No load test. Exported logs contain ordinary boot/shutdown events (observed boot times 28–52 ms), not provider payloads or environment dumps.

## Credential absence and security

Secret-name dashboard inspection: **no custom secrets**, so Binance credentials absent. Platform-reserved Supabase secret names exist by default; their values were never opened, copied or passed to the adapter. No placeholder Binance credentials were entered.

Known local Binance exact-value scan across repository, final bundle, both saved hosted responses and exported logs: zero findings. Sensitive Supabase key/JWT/private-key pattern scan across public artifacts and 37 JSON-exported log records: zero findings. No source maps/environment dumps. A broad repository pattern scanner flags the older offline benchmark's known dummy string; it is not a credential and is not deployed. Historical Netlify values were not re-read; absence of those exact unknown historical values is supported by bundle provenance/no environment loading and pattern checks, not a claimed historical-value comparison.

Binance hosted requests: **0**, authenticated or unauthenticated. No Binance secret exists in this project. There was no exposure requiring shutdown.

## Inactivity, rollback and Gate B

[Supabase Free pausing](https://supabase.com/docs/guides/platform/free-project-pausing) considers low database activity over seven days. Owner receives warning/confirmation emails and can resume via the dashboard. Gateway traffic is not guaranteed to prevent pausing; treat the function as unavailable while the project is paused until manually resumed and checked. No artificial keepalive or paid upgrade added. This remains a judging-availability risk.

Cloudflare remains synthetic-only and unchanged. Netlify remains inactive/unintegrated and unchanged. No wallet/signing/simulation/broadcast occurred. The branch is pushed; no merge.

**Gate A passes with observed, not permanent, regional assurance and the explicit receipt-test scope qualification above. STOP before Gate B.** Owner must separately authorize Binance credential entry. Adding credentials alone will not enable this deliberately locked Gate A adapter; any live adapter change needs its own review and controlled validation. Rollback remains the existing static/unavailable frontend, never the prohibited US Netlify backend.
