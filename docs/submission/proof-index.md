# AfterClose — judge proof index

AfterClose is an entirely independent, read-only tokenized-stock evidence research project. It separates a token observation from the independent reference and execution evidence needed to interpret a price gap.

| Proof | Inspect | What it establishes |
| --- | --- | --- |
| Live view | [Public demo](https://afterclose-preview.pages.dev/) → **Refresh Live Evidence** once | A new permitted gateway evaluation; no auto-refresh. Unavailability stays explicit. |
| Genuine historical Binance observation | [Production receipt](../deployment/public-live-production-receipt.json), October 9, 2026 | Ondo NVDAon on BSC 56, contract `0xa9ee28c80f960b889dfbd1902055218cba016f75`; token price `234.468149568753095452` USD **at that past observation**, not a current quote. All six provider audits: HTTP 200/code 0. |
| Separate clocks | Same receipt, `fields` → `token-price` | Provider `2026-10-09T12:34:56.322Z`; observed `12:35:01.896Z`; evaluated `12:35:01.903Z`. Ages at evaluation: 5,581 ms / 7 ms. |
| Canonical result | Same receipt, `engine` | **PARTIAL / WAIT**; missing independent equity reference, applicable multiplier, authoritative session and execution evidence. |
| Integrity and reproduction | Command below | Checks canonical bytes, SHA-256 and deterministic engine result. It does not authenticate Binance or independently validate its data. |
| Synthetic examples | [12-case Scenario Lab](https://afterclose-preview.pages.dev/lab/#/lab/fresh-evidence) | Explicit **SYNTHETIC SCENARIO** labels and frozen fictional inputs. `fresh-evidence` → PROCEED_TO_REVIEW; `market-closed` → MONITOR; the other ten → WAIT. No provider calls or execution. |
| Release provenance | [Release record](../deployment/public-live-release.md) and [structured checks](../deployment/public-live-evidence.json) | Deployed source `8eba2c9`, staging-first promotion, served-asset parity, mobile checks and preserved synthetic rollback `0bd20e4d-c861-4ee0-898f-ea43c579fc44`. |

From the repository root, with Node 24 and `npm ci` completed, run this **offline, credential-free** verification:

```sh
node --conditions=react-server --import tsx scripts/verify-evidence-receipt.ts docs/deployment/public-live-production-receipt.json 683861e0d9d33248f8bfc36cb7f309f51a3cb4771260c58ce6cde74c347d8351
```

Expected: `verified:true`, digest matching the command, `decision:"WAIT"`. [Fresh-clone reproduction](../reproduction.md) also covers all 190 baseline tests and local offline views.

**Mode boundary:** The live page never falls back to this historical receipt or to synthetic fixtures. Browser SHA-256 verification checks content integrity only; the repository command additionally reproduces the engine. The optional local receipt replay is prominently historical, not a new live evaluation.

**Limitations:** No independent live NVDA equity quote or verified current multiplier interval; published calendars are not live security-status feeds. No wallet, executable quote integration, simulation, transaction signing or trading. Per-worker cache/cooldown and tab-session safeguards are not a global rate limiter. The [owner's firsthand report, video and track-fit review](checklist.md) remain submission work; no form submission is claimed.
