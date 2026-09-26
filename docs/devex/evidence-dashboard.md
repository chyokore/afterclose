# 2026-09-26 — Evidence Dashboard v1

Continued from c84c89ee6a6bb29707d9383f83535aa65e26c196 in chyokore/afterclose. Reused the existing Binance client, response schemas, live adapter, ReferenceComparison and pure Reference Truth Engine. No engine policy/rule or original test changed.

## Product decisions

The `/` dashboard puts the actual engine decision and blocking-finding count beside the snapshot status, followed by NVDAon identity, chain, contract, token price and token-price age. It shows source-by-source provenance, independently unavailable reference evidence, unverified multiplier applicability and historical explorer corroboration. Detailed token-derived reference values are disclosed separately, not promoted to independent equity prices. Long exact provider decimal strings are preserved in the live evidence card.

The server loader assembles either a validated live bundle or an explicit unavailable bundle; both run through the real engine. Failed/missing API access withholds prices and retains only explicitly historical discovery context. The UI does not implement a second decision algorithm. Engine finding codes/messages and severity are displayed verbatim. Evidence metrics report present/unavailable values without claiming that mere presence passes validation. Refresh uses Next router.refresh with a pending state rather than silently treating old data as current.

Provider token timestamp, application observation and evaluation clocks are labeled separately. UTC and America/New_York formatting use Intl, including daylight saving time. Display ages are frozen at the labeled snapshot, not a streaming freshness claim. Missing event time remains Unavailable; future time is flagged. A new response cannot fill missing market time.

Binance statusInfo is displayed as raw provider status. With no authoritative equity calendar/security status connected, the live adapter now always supplies unknown session to the engine, even if a provider string happens to say regular. This tightens evidence admission without changing engine rules. Holidays and early closes are not guessed.

## Scenario lab and provider readiness

`/demo?scenario=...` retains all eight original scenarios and adds missing-independent, stale-token, closed-stale-reference and missing-multiplier. All use the actual engine at a frozen fictional evaluation time. The prominent label is SYNTHETIC SCENARIO — NOT LIVE MARKET DATA. Session inputs are explicitly fictional, not inferred from the frozen calendar date. The original fresh-evidence fixture genuinely permits PROCEED_TO_REVIEW under existing rules, but execution remains disabled.

The provider-neutral IndependentEquityProvider interface describes identity, price, provider event timestamp semantics, local observation, session, recency, entitlement, source coverage and availability. Its only adapter explicitly returns unavailable with no price/provider/event timestamp and makes no network request. A separately authorized, entitled real-provider implementation remains future work. No new key or account was requested.

## Actual development observations

An initial PowerShell directory-creation command used incorrect positional syntax and failed for the two new directories; it was corrected before creating the modules. The first full test run passed 69 tests. Lint then caught Date.now in render and a plain anchor used for refresh; snapshot assembly moved into the server loader and a small client refresh control resolved those issues. No TLS verification, network configuration or credential settings changed.

Regression coverage adds missing timestamps, future timestamps, New York winter/summer formatting, four incomplete-evidence scenarios, unverified multiplier/session mapping, unavailable provider behavior, provenance labels and production import isolation. Existing mixed-provenance rejection remains active.

AI assistance: Codex inspected the existing implementation, built the dashboard using existing components, added the unavailable interface and isolated fixtures, and ran the checks recorded below. No live response was fabricated. No other project's files, trading endpoints or wallet execution were accessed.

Remaining blockers: independent equity access/display rights and two qualified provider observations; issuer-backed current ratio validity; fresh contract confirmation; authoritative calendar/security state; liquidity and executable quote evidence. The dashboard exposes those gaps while showing the real evidence available.

## Final validation and preview

`npm test`: 69/69 passed, including all original 61 and eight dashboard regressions. `npm run lint`: passed after the fixes (and again after removing the unused static unavailable-decision branch). `npm run build`: passed, with dynamic `/` and `/demo` routes. The suite's synthetic HTTP 401 safeguard log is not a live authentication failure.

The production preview was launched on local port 3004 with process-local NODE_USE_SYSTEM_CA=1 and certificate verification enabled. Hidden browser attachment initially timed out; a visible preview tab attached successfully. Browser inspection confirmed the live contract, actual provider price and token timestamp, separate snapshot clock, unknown equity session and eight engine-generated blocking findings. One historical browser-check observation showed token price 225.250699420510246377 with tokenPriceUpdatedAt 1790442594406 and snapshot 2026-09-26T17:09:59.156Z; these are test observations, not hardcoded live values.

Visual checks at the browser's narrow viewport showed readable stacked cards and the prominent synthetic banner. The fresh-evidence demo visibly returned PROCEED_TO_REVIEW with execution disabled; clicking missing-multiplier returned WAIT with MISSING_EVIDENCE and GAP_UNAVAILABLE. The live page was restored as the deliverable. Desktop-wide layout was not separately screenshot-tested. No independent quote provider was contacted.

Final credential-value scan: zero matches across 57 project and browser-bundle files. `.env.local` remains Git-ignored; git diff --check passed. No credentials are staged. Engine source and original test files remain unchanged.
Refresh interaction also passed: the control entered a disabled pending state, then updated both the actual token timestamp and snapshot timestamp while the engine remained WAIT.
