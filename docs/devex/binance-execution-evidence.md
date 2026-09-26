# Binance execution evidence research — September 26, 2026

See the [sourced feasibility report](../research/binance-execution-evidence.md) for endpoint mappings and the sanitized live result.

The authenticated aggregator chain-list request returned HTTP 200/code 0 in 2,487 ms and listed BSC 56. Node 24.21.0 used process-local Windows system CA trust with certificate verification enabled. This observation establishes connectivity for that request; it does not independently establish VPN status or causation.

The principal blocker appeared in documentation before any quote request: Ondo/BStock RWA quotes require a user wallet address and use RFQ. No address was invented or supplied. No quote, simulation, transaction-building or broadcasting endpoint was called. No no-route outcome or authentication rejection was observed.

Documentation friction: BSC USDT metadata uses 18 decimals while a generic amount example describes six; estimated gas cost naming/example needs unit clarification; EVM simulation calldata is marked required but described as optional. Approximate quote cache lifetime is not an explicit expiry timestamp. Chain-list permission does not prove quote or simulation permission.

Implementation decision: documentation-only provider-neutral model and integration plan. Preserve all engine thresholds, live WAIT, production adapters and synthetic isolation. Quote retrieval, price timestamps, expiry and simulation status must remain distinct. No new API experiences or prices were invented.

AI assistance: OpenAI Codex inspected AfterClose, researched official Binance documentation, ran the single sanitized read-only diagnostic and drafted this report. No other project's files or credentials were accessed.

Validation: `npm test` passed all 69 tests; `npm run lint` passed. The first `npm run build` failed with EPERM while removing an old `.next/static` entry marked as a OneDrive reparse point. The generated `.next` directory was moved to an ignored backup inside AfterClose and the build retried. Final build and credential-scan results follow below. The test-suite HTTP 401 log was a synthetic safeguard test, not a live authentication rejection.

Final validation: the clean-cache retry of `npm run build` passed. Credential-value scan of repository files and generated browser assets found zero matches; `.env.local` remains ignored. `git diff --check` passed. No application code changed, so no new implementation tests were added.
