# Binance execution evidence feasibility

Research and one read-only diagnostic: September 26, 2026. Baseline: `1c33526ce6d132ffc60802279d2f03a82981e6be`. This milestone changes documentation only.

**Conclusion:** Binance documents BSC quotes and off-chain simulation, but NVDAon's route remains untested. Equity/RWA quotes require a wallet address. No address was supplied or substituted. No transaction was created, signed, approved, submitted or broadcast. The live Reference Truth Engine remains WAIT.

## Official quote service

The [Trading API](https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/trading-api) documents the base `https://web3.binance.com/build`:

| Method and path | Parameters and meaning |
| --- | --- |
| GET `/api/v1/dex/aggregator/supported/chain` | Optional `binanceChainId`; dynamic supported-chain list. |
| GET `/api/v1/dex/aggregator/quote` | Required `binanceChainId`, `amount`, `fromTokenAddress`, `toTokenAddress`. Amount is a positive integer string in input base units. **`userWalletAddress` is required for Ondo/BStock RFQ.** Optional vendor selector and paired custom-fee parameters. |

Equity/RWA uses RFQ. Routes are estimates, sorted by output; quote IDs have approximately 30-second cache lifetime. This is not a supplied absolute expiry. Slippage controls belong to transaction building, not this quote request. Approval-building and swap-building endpoints are outside this milestone.

The documentation shows BSC USDT `0x55d398326f99059fF775485246999027B3197955` with decimal `18`, but its generic amount explanation uses six-decimal USDT. Validate chain-specific decimals before converting amounts. USDT is a documented candidate here, not a live-tested pair or a guaranteed USD conversion.

### Documented quote fields, not observed quote data

The [official machine-readable schema](https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/1.0.0/schema.json) describes an envelope with a route array:

| Fields | Mapping / caution |
| --- | --- |
| `quoteId`, `vendorName`, `binanceChainId`, `executionMode`, `isBest` | Provider route identity; SWAP/RFQ; best only among returned estimates. |
| `fromTokenAmount`, `toTokenAmount` | Integer strings; estimated amounts in respective base units. |
| `fromToken`, `toToken` | Contract, symbol, `decimal` string, unit price, honeypot flag, tax rate. |
| `router`, `dexRouterList` | Address path and hop protocols/percentages; not executable liquidity depth. |
| `priceImpactPercent` | Nullable percentage string; not slippage tolerance. Preserve sign. |
| `tradeFee` | Nullable estimated network fee in USD. |
| `estimateGasFee` | Nullable gas cost documented in smallest chain units. Example resembles gas units; do not reinterpret as gas limit or multiply again without clarification. |
| `approveTarget` | Nullable approval target; no AfterClose allowance verification. |
| `feeAmount`, `feeToken`, `actualSwapAmount` | Conditional custom-fee information. |

Envelope `timestamp` is response time, not underlying equity time. No explicit absolute expiry, complete liquidity depth or simulation result is established by these fields.

## Actual safe test

Correct Git remote was confirmed as `https://github.com/chyokore/afterclose.git`. A temporary ignored diagnostic securely loaded `.env.local`, reused the existing GET-signature helper, and sent exactly one authenticated request to the official base. Node 24.21.0 used process-local `NODE_USE_SYSTEM_CA=1`; TLS verification remained enabled. No DNS, VPN, proxy or certificate-store settings changed.

```json
{
  "method": "GET",
  "endpoint": "/api/v1/dex/aggregator/supported/chain",
  "query": { "binanceChainId": "56" },
  "http": 200,
  "latencyMs": 2487,
  "code": 0,
  "success": true,
  "responseTimestamp": 1790443417898,
  "chains": [{ "binanceChainId": "56", "name": "BNB Smart Chain", "shortName": "BSC" }],
  "schemaValid": true,
  "observedAt": "2026-09-26T17:23:37.283Z"
}
```

These are selected public response fields plus local measurements. Response timestamp and observation time remain separate. This confirms authenticated chain-list access and BSC aggregator support, not quote/simulation permissions or NVDAon support.

NVDAon candidate: prior RWA API-reported contract `0xa9ee28c80f960b889dfbd1902055218cba016f75`, chain 56. The quote test stopped at the documented wallet requirement. **No route request or no-route response exists in this milestone.** Nothing here establishes lack of market liquidity. No new token price, fee, route, impact or simulated balance change was retrieved.

## Simulation is separate

The [Transaction API](https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/transaction-api) documents:

| Method and path | Inputs / capability |
| --- | --- |
| GET `/api/v1/dex/pre-transaction/supported/chain` | No parameters documented; dynamic transaction-service chains. Not called. |
| GET `/api/v1/dex/pre-transaction/gas-price` | `binanceChainId`; legacy/EIP-1559 fee tiers, not transaction gas usage. |
| POST `/api/v1/dex/pre-transaction/gas-limit` | Chain and unsigned transaction context; estimates gas. |
| POST `/api/v1/dex/pre-transaction/simulate` | Chain plus exactly one transaction variant. BSC uses `evmTx`: sender `from`, destination `to`, `value`, `data`. |

Simulation returns inner `status`, `failReason`, `balanceChanges` and `allowanceChanges`. Check inner failure even when the envelope succeeds. BSC appears in documented examples; its simulation-service availability was not live-tested. EVM simulation has no signed-transaction input. API authentication signing is separate from wallet signing.

`data` is marked required while its prose says optional: a documentation inconsistency. No balance/allowance override inputs are documented. Sender state can affect execution (inference consistent with the documented insufficient-balance failure). No wallet or authentic calldata exists here, so simulation was not attempted. RFQ settlement needs additional provider clarification; a quote is not a simulated or fillable order. Broadcast endpoints are excluded.

## Market data, permissions and limits

The [General Data API](https://web3.binance.com/en/dev-docs/catalog/web3-wallet/api/rest-api/general-data) separates market observations from trading:

| Method and path | Required inputs / output |
| --- | --- |
| GET `/api/v1/dex/market/token/search` | `chains`, `search`; token identities, not route guarantees. |
| POST `/api/v1/dex/market/token/basic-info` | Documentation lists query `binanceChainId`, `tokenContractAddress`; identity and integer decimals. |
| GET `/api/v1/dex/market/token/top-liquidity` | Chain and contract; pool array with protocol, address, `liquidityUsd`, token amounts. |

None was called this milestone. Pool TVL is not order-size executable liquidity; RFQ liquidity need not appear in a pool list. An empty result would describe that service/request, not the whole market.

[Authentication documentation](https://web3.binance.com/en/dev-docs/authentication) requires API key, timestamp and Base64 HMAC-SHA256 request signature. GET signing includes the full `/build` path and query; POST signing binds the actual body. Default receive window is 5 seconds, maximum 60 seconds. Documented defaults: IP 1,200/minute, key 1,200/minute, user 6,000/minute, endpoint 5 requests/second; concurrent limits are not additive. HTTP 429 supplies `Retry-After`. Missing/invalid key, signature mismatch, expired request and permission rejection are distinct errors. No such rejection occurred in this test. Exact quote/simulation entitlement scope names remain unverified; chain-list success does not establish access to every endpoint.

## Proposed provider-neutral evidence model

Design only; no adapter or engine schema changes:

| Group | Proposed typed fields |
| --- | --- |
| Identity | Provider, chain ID, quote ID; input/output token contract, symbol and verified decimals. |
| Amounts | Exact input base-unit integer string; estimated output base-unit integer string. Avoid floating-point conversion. |
| Time | Request and observation times; nullable provider response time and absolute expiry. Keep documented approximate TTL as separate metadata. |
| Route | Nullable vendor, execution mode, hop list and liquidity sources. Unknown depth stays null. |
| Economics | Nullable signed impact percentage; separate slippage assumption and estimated slippage; fee entries with amount/unit/currency and inclusion semantics. |
| Gas | Separate nullable gas units, gas price, gas cost and USD estimate. Never conflate units. |
| Availability | Explicit `not-tested`, `wallet-required`, `quoted`, `no-route`, `unavailable` or `invalid`; sanitized provider warnings/error code. `no-route` requires an actual provider response. |
| Simulation | Separate not-run/pass/fail/unknown result, timestamp, context binding and optional block/state identity. Never derive pass from quote success. |
| Provenance | Endpoint, observed fields, validation result, raw sanitized provider payload retained separately from normalization. |

Nullable fields represent unknown evidence, not zero fees or zero impact. A future validator must require identity, exact integer amounts, chain/address consistency and explicit units; reject mismatched requests and malformed responses. Never use retrieval time as a price timestamp.

## Engine integration proposal and remaining requirements

The existing engine expects a fee-inclusive quote bound to its proposed side, quantity, currency and token, with freshness/expiry and execution checks. An exact-input RFQ estimate does not automatically satisfy that model. Estimated buy output also cannot silently become an exact proposed quantity. USDT amounts require an explicit currency basis before comparison with USD equity evidence.

Keep production quote/liquidity evidence unavailable until the mapping is supported. Future expiry policy must distinguish provider expiry from local freshness limits. Quote freshness cannot repair stale underlying evidence; simulation results also need request/context binding and their own freshness assessment. A successful quote alone must never set `executable=true` or authorize review.

No production thresholds, decision rules, synthetic fixtures, Binance adapters or UI were changed. Live WAIT remains appropriate while independent equity quotes, a verified current shares-per-token multiplier, authoritative market session and execution evidence are unresolved. Future work requires authorized wallet context, verified pair metadata, endpoint permissions, RFQ-specific simulation guidance and validated evidence mappings. No account creation, trading or execution is part of this proposal.
