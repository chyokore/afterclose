# Issuer and session evidence — September 26, 2026

See [research and source record](../research/issuer-multiplier-and-session.md).

Actual access: official Ondo API schema HTTP 200; unauthenticated NVDAon address and multiplier-history requests HTTP 403 with generic Forbidden. The cause was not established. Official public asset page HTTP 200 corroborated the exact BSC address and reported the same decimal ratio as prior Binance history. No effective timestamp appeared in the inspected metadata; current applicability remains unverified.

Implemented a bounded server-only page reader with strict metadata parsing and exact decimal-string retention. The live adapter check returned `reported`, issuer source, matching identity, null effective/expiry and unverified status. Its observation was Unix ms 1790445689387. No authentication headers or secrets were sent to Ondo. The initial ignored diagnostic failed before requesting data because top-level await was incompatible with the repository's CommonJS output; wrapping its entry point fixed the diagnostic.

Nasdaq's public calendar and hours were accessible. An announced December hours change and unspecified early-close extended hours motivated explicit coverage and unknown states. Implemented a display-only schedule adapter with a fixed source-review observation, seven-day local expiry, DST handling and no engine promotion. This is not a real-time status feed. Live check returned scheduled closed for September 26; actual security status remains unverified.

The existing 69 tests plus 11 issuer/session tests passed (80 total), and lint passed on the first run. The suite's 401 log is synthetic, not a new live Binance error. Final build, review and secret-scan results will be appended after completion.

AI assistance: OpenAI Codex inspected AfterClose, researched the linked official sources, performed the recorded read-only probes, implemented adapters/UI and regression tests, and wrote this diary. No other project, account purchase, wallet connection, transaction or broadcast was used.

The first production build found two compatibility errors with the existing TypeScript target: a BigInt literal and a dotAll regular-expression flag. Replaced them with the BigInt constructor and an equivalent character class; exact arithmetic and the configured target were preserved. Full validation was rerun after that correction and the final UI wording review.

Final validation: all 80 tests passed, lint passed, and the production build passed. The built server on 127.0.0.1:3005 returned HTTP 200; rendered HTML contained live Binance status, issuer-reported ratio, missing effective-time labels, schedule-only wording, authoritative-status unverified, and WAIT. Rendered HTML credential scan found zero matches. Browser attachment timed out and a UI open request was queued, so no visual screenshot review is claimed.

Final repository/browser-asset credential-value scan: 66 files, zero matches; .env.local remains ignored. Whitespace diff check passed.
