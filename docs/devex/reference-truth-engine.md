# Reference Truth Engine v1 — September 26, 2026

This milestone implements offline evidence evaluation. No Binance requests were made for engine development and no successful live API experience is claimed. Starting commit: `0b01a87b2659e5f81d627355850bdce330b34e0b`. Only AfterClose was accessed.

## Implementation

- `src/lib/reference-truth/models.ts`: TypeScript models inferred from runtime Zod schemas. Models cover tokenized stocks, issuers/providers, underlying equities, currencies, token prices, independent versus token-derived references, provenance, separate provider/observation timestamps, sessions, shares-per-token multipliers, liquidity, proposed order inputs and executable quotes.
- `src/lib/reference-truth/engine.ts`: pure evaluation function with an explicit clock and validated policy. No network, environment-variable access, wallet, signing, or broadcast code.
- `src/demo/reference-fixtures.ts`: explicitly fictional scenarios, separate from Binance adapters. No documentation example contract is reused. Demo clock and session are artificial, not a real exchange calendar.
- `src/components/reference-comparison.tsx` and `/demo`: labeled evidence comparison and scenario navigation. Production landing page shows independent evidence unavailable and links to the demo. It does not pass Binance token-derived references into the engine as equity quotes.

## Rules and units

All timestamps are Unix milliseconds. Provider price time and AfterClose observation time have distinct discriminants. Missing, future, stale or contradictory clocks block review. A newer observation never refreshes an older provider price.

Normalized token price per share = token price / shares per token. Reference consensus is the median of independently labeled equity quotes in the same currency for the same underlying. Gap in basis points = (normalized token price / consensus - 1) * 10,000. Provider disagreement is (highest - lowest reference) / median * 10,000. This is a comparison, not an arbitrage or profit claim.

WAIT applies to missing/invalid evidence, unavailable API evidence, identity/currency mismatches, token-derived or insufficient independent references, mixed synthetic/live provenance, conflicting providers, stale evidence, halted/unknown session, expired multipliers, insufficient liquidity, missing/nonexecutable/expired or mismatched quotes, and excessive slippage. Missing runtime properties also fail closed.

MONITOR applies when otherwise complete evidence has a gap below the configured threshold or a market session outside the review policy (including closed markets). Critical failures take precedence over MONITOR.

PROCEED_TO_REVIEW means every configured check passed for a separately proposed spot order. It never executes a transaction. Every result has execution DISABLED. Synthetic results remain explicitly synthetic even when all checks pass.

Illustrative defaults: price ages at most 60 seconds, observation ages at most 30 seconds, multiplier effective age at most 24 hours with unexpired validity, two distinct independent providers, at least 10,000 currency units of liquidity and coverage for the proposed order, at most 50 bps slippage/fee-inclusive adverse quote deviation, at most 25 bps provider disagreement, at least 50 bps absolute gap, regular session only. Age limits are inclusive; quote/multiplier expiration is exclusive. These defaults are not calibrated market recommendations.

## Test coverage

Eight required scenarios: fresh token/stale reference, all fresh, missing underlying timestamp, provider disagreement, insufficient liquidity, high slippage, closed market and API unavailable. Additional tests remove required evidence one field at a time and exercise timestamp, identity, currency, provenance, quote, configuration and numeric failure cases. WebCrypto/client tests from the foundation remain intact and use synthetic responses.

## Observations and limits

- Fixture clocks must be independent objects. The fixture factory explicitly copies each timestamp so making an underlying reference stale cannot accidentally change token freshness.
- Runtime validation matters: TypeScript alone cannot prevent malformed adapter payloads from reaching a decision function.
- Independent-provider labels are supplied evidence, not proof of feed independence. Future adapters must verify origins, identities, source timestamps and corporate-action multipliers; this engine cannot attest to them.
- JavaScript numbers are used for research comparisons with finite/positive/range checks. This is not settlement arithmetic; exact decimal/base-unit accounting is required before any execution feature.
- Liquidity and quote checks trust adapter measurements. No order-book simulation, on-chain verification, exchange calendar, FX conversion, custody/redemption assessment, or profitability model exists.
- A live evidence adapter, independently sourced equity quotes with genuine timestamps, verified BSC issuer metadata, current multipliers, liquidity and exact-order executable quotes remain required. Binance connectivity remains unresolved from prior diagnostics.
- AI assistance: Codex designed the models/rules, implemented the UI and synthetic fixtures, and ran the recorded checks. No live prices or provider responses were fabricated.

## Validation

Final validation: `npm test` passed 54 tests (51 engine checks and 3 existing authentication/client tests); `npm run lint` passed; `npm run build` passed. Production browser inspection of `/demo` verified visible synthetic labels, separate age columns, the normalized comparison, scenario navigation, WAIT for stale references, PROCEED_TO_REVIEW for complete synthetic evidence, and MONITOR for a closed market. Desktop screenshots were inspected; mobile-specific visual testing was not performed. No live Binance requests were needed. The existing Binance client and integrations are unchanged.

Implementation troubleshooting: the first test run passed 52 tests but lint rejected an unnecessary Date.now call in the unavailable-state render. Removed the clock prop from that state. Expanded coverage to 54 tests, including removal of every required nested field and fee-inclusive liquidity coverage. The first production type check then rejected a widened string array in the frozen default policy; added an explicit policy generic to preserve the allowed session union. These were local implementation errors, not Binance API errors.

Security review: no credential-value matches in the 11 staged files or 12 browser-bundle files; .env.local remains ignored. An initial bundle scan hit EISDIR while relying on directory-entry type flags. Retried using filesystem stat checks and bounded resolved paths; the scan completed successfully. No credentials or authentication headers were printed.
