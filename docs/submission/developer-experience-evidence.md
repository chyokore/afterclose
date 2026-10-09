# Developer Experience evidence outline — owner review required

This is an AI-assisted index of engineering records, **not the owner's firsthand report**. The owner must review the evidence and write her own account. Do not submit this outline as that report. Personal onboarding duration, portal impressions, account permissions and support interactions are unknown unless the owner supplies them.

## Evidence to consult

| Topic | Verified observation and exact record | Owner writing prompt |
| --- | --- | --- |
| Onboarding | [Connectivity diary](../devex/live-verification.md), September 26, 2026: initial `ENOTFOUND` and `UND_ERR_CONNECT_TIMEOUT`; no HTTP authentication result existed then. | Describe your actual portal/application setup, time spent and permissions requested. |
| Authentication | [October 7 diagnosis](../deployment/binance-hosted-auth-diagnosis.md): three local discovery requests succeeded with HTTP 200/code 0; shared GET signing implementation uses UTC ISO timestamp, HMAC-SHA256/Base64 and nonce. [Official authentication documentation](https://web3.binance.com/en/dev-docs/authentication). | Which instructions were clear or ambiguous to you? |
| TLS | [Connectivity diary](../devex/live-verification.md): the existing Windows system trust restored Node verification using `NODE_USE_SYSTEM_CA=1`; TLS was not disabled and local certificates were not copied to hosting. | Describe the actual setup friction, distinguishing DNS from TLS. |
| Credential mismatch | [Diagnosis](../deployment/binance-hosted-auth-diagnosis.md): at `2026-10-07T14:53:34.004Z`, a private in-memory comparison found both Netlify values DIFFERENT from known-good local values. No values or digests were published. | Explain what you personally entered or checked; do not infer a portal fault. |
| Region | The same diagnosis established Netlify `us-east-2`/Ohio versus Binance's documented server-location restriction. [Official restricted regions](https://web3.binance.com/en/dev-docs/web3-api-prohibited-regions). Frankfurt was later verified at runtime. | Explain why region-first hosting selection mattered. |
| `40304` | Historical HTTP 200/provider `40304` is recorded; its precise provider meaning remains unexplained. Region incompatibility and differing credentials were separate observations, not a definitive decoding of this error. | Request actionable error documentation without assigning an unproven cause. |
| Rate limits | Historical HTTP 429/code `42900` stopped testing. Gateway now honors Retry-After, bounds fixed provider calls, and has per-isolate cache/cooldown. Browser requests are manual and coalesced. These are not global quota coordination. | Describe the useful quota/backoff information you actually received. |
| Timestamps | [Prompt 27 receipt](../deployment/supabase-cache-repair-first-receipt.json): provider price time `2026-10-09T11:44:26.327Z`, observed `11:44:29.519Z`, evaluated `11:44:29.535Z`. These are historical evidence, never a current quote. | Explain why provider time and observation time must remain separate. |
| Reference limitations | The same receipt retains PARTIAL/WAIT: no independent NVDA equity reference, verified multiplier applicability, authoritative session or executable quote. Token-derived reference pricing is not independent equity evidence. | Explain which missing fields prevented the intended comparison. |
| Supabase isolates | [Gate B](../deployment/supabase-binance-live-validation.md) initially returned 503 on a fresh cache-only isolate. [Repair](../deployment/supabase-cache-repair.md) made each permitted miss independently capture. Two hosted MISS requests succeeded; no shared cache is claimed. | Describe why instance-local state affected reliability and quotas. |
| Reproducibility | Committed receipt envelopes pass canonical SHA-256 and engine reproduction. Browser integrity verification recomputes SHA-256 only. Neither proves provider authenticity. | Explain how a judge can reproduce the decision. |

## Requested improvements (proposals, not provider commitments)

Document `40304` and distinguish credentials, permissions and server geography; expose quota/backoff headers consistently; document timestamp semantics per field; publish independently sourced equity timestamps and provenance where licensed; provide issuer ratio applicability intervals and authoritative session/security status. Add deployment examples covering runtime regions and isolate-local caching.

## AI assistance disclosure

Codex assisted with source implementation, tests, browser QA, sanitized diagnostics, release preparation and this evidence index. Owner-authored reflections are still required. Use the [official competition requirements](https://www.bnbchain.org/en/hackathons/tokenized-stocks) and the owner's actual experience; no generated personal narrative or fabricated time estimates.
