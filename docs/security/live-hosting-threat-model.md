# Live hosting threat model
2026-10-06. Browser → AfterClose Node server → fixed Binance Web3 GETs + anonymous Ondo page → schema projection → unchanged Reference Truth Engine → canonical receipt → browser. Local validated snapshot is a separate HISTORICAL view.
Trust boundaries: untrusted visitors, external provider content, trusted host environment, server process, public serialization. No transaction API, wallet SDK or signing wallet exists.

| Threat | Likelihood / impact before controls | Mitigation | Validation | Residual risk |
|---|---|---|---|---|
| API key / secret exposure | Medium / critical | server-only modules; no public env; minimal props | exact-value and browser scans | trusted host/admin compromise |
| Signed requests / auth headers | Medium / high | server GET only, fixed TLS host, redirect error, never log headers | transport tests; browser network audit | provider sees authentication by design |
| Query-string leakage | Medium / high | fixed non-secret signed query; reject unexpected live query | malicious-input tests | visitor's own query may enter host access logs |
| Server logs | Medium / high | only endpoint enum and status; no body/env logging | logs exact/pattern scan | future diagnostic code regression |
| Exception traces | Medium / high | sanitize transport errors and safe UI boundary | DNS/TLS/timeout/body tests | platform failure traces require review |
| Source maps | Low / critical | no production browser source-map option; scan generated files | artifact scan | host/admin server maps remain sensitive source |
| Build cache/artifacts | High / critical | isolated source/env build, no .env, persistent Turbopack cache disabled | zero-call build and binary exact scan | alternate build command could bypass policy |
| Browser JS / HTML / RSC | Medium / critical | public projection only; server-only imports | captured network bodies plus exact/name scans | future serialization changes |
| Cached server response | Medium / high | only projected observation cached; no auth objects; dynamic pages | cache concurrency and receipt tests | process memory remains trusted |
| Receipt content | Medium / high | typed canonical projection, reflection rejection | receipt tests and scan | digest is integrity, not issuer signature |
| Snapshot content | Medium / high | bounded validated receipt outside public; reflection check; historical label | persistence/tamper tests and scan | ephemeral loss, no durable audit guarantee |
| Malicious client params | High / high | exact endpoint/chain/asset shapes; live query only framework RSC token | arbitrary URL/path/method/chain tests | HTTP parsing/Next vulnerabilities outside application policy |
| SSRF / arbitrary proxy | High / critical | no URL input or proxy route; fixed hosts and GETs | base override and redirect tests | compromised dependencies/provider DNS |
| Endpoint abuse | High / high | only six evidence reads; no wallet/quote/broadcast route | route audit, fixed policy tests | valid requests still consume public app CPU |
| Refresh/API exhaustion | High / high | one capture, coalescing, 30s success / 60s failure cooldown, timeout, no retry, body cap | 100 concurrent requests and boundary tests | not distributed DDoS protection; restarts reset limits |
| Stale cached data called live | High / high | preserve raw clocks; re-evaluate age; client status ages; historical snapshots separate | missing/stale timestamp tests and browser wait | frozen exported receipt describes its evaluation only |
| Provider outage or schema drift | High / medium | fail closed, WAIT, Retry, separate Scenario Lab | full failure matrix | genuine live demo unavailable during outage |
| Provider echoes secret in valid field | Low / critical | in-memory reflection rejection before return and snapshot | reflection test | transformed/novel encoding not exhaustive |
| Accidental execution functionality | Low / critical | no wallet keys/SDK/actions; fixed evidence GET allowlist | route/source audit | future features require new review |
| Environment dumps | Medium / critical | no process.env response/log; env audit; build allowlist | source/client/log scans | trusted operator must not enable debug dumps |
| Cold start / quota suspension | High / medium | loading/retry messaging and existing static fallback | local delayed-response QA; owner limits checklist | app cannot replace Render's wake page |
| Snapshot rollback/tamper | Medium / medium | digest validation, engine identity, reject older/equal saves | snapshot tamper/concurrent save tests | local hash is not external notarization |

## Operational decisions
Health reports configured readiness, never Binance health. Provider downtime must not cause continuous platform restarts. Production configuration failure returns 503 intentionally.
A single public instance bounds provider captures but does not guarantee protection from HTTP floods. No paid cache/WAF/database or artificial keepalive was added.
No independent provider was integrated. Partial genuine observations still yield WAIT. All fixture responses are confined to tests or unmistakably synthetic Scenario Lab.
