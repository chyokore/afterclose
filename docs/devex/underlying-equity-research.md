# 2026-09-26 — Independent equity reference research

Starting commit: ecbea8323ffeee1736aef8665b778b392c971ebd. Confirmed the AfterClose remote and clean baseline before editing.

Researched official material for Massive/Polygon, Finnhub, Twelve Data, Alpha Vantage, Alpaca, Ondo and Chainlink. The [research comparison and design](../research/underlying-equity-providers.md) selects Massive business access with an entitled full-market trade/quote feed as the primary technical choice. Twelve Data is a conditional fallback: public rights, feed coverage and actual price-event timestamp semantics must pass before admission. No accounts, subscriptions, keys or adapters were created.

Actual documentation findings:

- Massive distinguishes exchange-event and SIP-receipt timestamps; its business FMV baseline is not an actual exchange trade. Real-time full-market entitlement and public display rights require explicit selection.
- Twelve Data defines quote.timestamp as interval opening time. last_update_at is documented, but its precise event association remains unresolved. The real-time premarket window starts at 07:00 ET, later than historical coverage. Its usage articles use inconsistent wording about paid personal versus business rights; obtain written terms.
- Finnhub official docs/pricing rendered empty in the web reader; an in-app browser attempt timed out. The official SDK confirms endpoint presence, but current quote timestamps, extended-hours entitlements and free quotas were not established. These are documentation gaps, not API failures.
- Alpha Vantage's public documentation demo explicitly says its bulk quote sample is artificial. Only field structure was examined; its prices were not treated as market observations. No account-specific quote or authentication test occurred.
- Alpaca documents event timestamps and feed limits; its individual subscriptions do not establish AfterClose public-display rights. The redistribution support page was inaccessible.
- Ondo's old ReadMe reference is deprecated. The current issuer multiplier-history page documents sharesMultiplier/changeTimestamp separately from response timestamp. General multiplier economics are supported by issuer and Chainlink documentation, but no current NVDAon ratio or future validity was verified.

Design decisions: document a neutral observation record with price kind, event-time semantics, observation time, session, entitlement, feed coverage and availability. Do not implement it yet. Keep the current engine's two-provider requirement, freshness limits and regular-session policy. A single new feed cannot unlock review. Unknown multiplier validity remains blocking; issuer change time is not future expiry. No engine, Binance, UI or test source changed.

AI assistance: Codex read official documentation, compared the evidence with the existing engine, drafted the comparison/provenance design, and performed repository validation. No sales outreach, account creation, credential changes, trades or transactions occurred. No other project's files or infrastructure were accessed.

Validation results are appended after the requested tests, lint, build and secret checks finish.

Completed validation: `npm test` passed all 61 tests; `npm run lint` passed; `npm run build` passed. The test suite's logged Binance HTTP 401 comes from its synthetic safeguard test, not a live authentication failure. A scan against existing local Binance credential values found zero matches in 38 project files, and `.env.local` remains ignored. `git diff --check` passed. Only the research document, this diary entry and its index changed.
