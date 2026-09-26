# AfterClose

**Don't trade the gap. Understand it first.**

Independent tokenized-stock research foundation for BNB Hack: Tokenized Stocks Edition. Target: BNB Smart Chain mainnet, chain ID **56**. This repository is independent of Noctive and uses none of its assets or infrastructure.

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm ci
cp .env.example .env.local
# Privately fill the two Binance credentials in .env.local.
npm run dev
```

On PowerShell, use `Copy-Item .env.example .env.local`. Do not paste credentials into source files, Git, screenshots, or chat. The application works without credentials and clearly shows setup required. Only chain ID is public. The base URL is pinned to the official Binance host to prevent credential forwarding.

The host used for initial development had Node 16. A checksum-verified Node 24.21.0 runtime was downloaded under ignored `.tools/`; it is not part of the repository. If using that local runtime on this machine, prepend `.tools/node-v24.21.0-win-x64` to PATH in the current terminal.

## Verify

```sh
npm run lint
npm test
npm run test:api
npm run build
npm start
```

`test:api` loads `.env.local`, performs only GET requests, discovers an eligible BSC contract through the API, and reports sanitized results. With no credentials it reports all five endpoints skipped and exits normally; that is **not** a successful connectivity test. Tests use clearly synthetic credentials/responses and never demonstrate live connectivity.

## Current scope

- Next.js App Router, TypeScript, Tailwind, ESLint, server-rendered landing page.
- Server-only HMAC-SHA256 client with exact encoded wire-path signing, `/build` prefix, timeouts, no redirects and no caching.
- Platforms, tokens, search, price and underlying-market read integrations; runtime validation of consumed fields.
- Live selection is restricted to API-discovered Ondo or bStocks stock tokens on BSC, then cross-checked through search and returned quote identity.
- Credentials were absent during foundation development and configured for a subsequent live attempt. That attempt failed at DNS/transport; real schemas and at least one actual BSC token remain unverified. See [live verification evidence](docs/devex/live-verification.md).

The documented `referencePrice` is token-derived per-share pricing, not an independent traditional-market quote. No genuine underlying-reference timestamp is documented. The application does not calculate a discovery signal or invent freshness. Provider market status is labeled as such. Liquidity, slippage, executable quotes and independent price feeds are future work.

No wallet connection, approvals, transactions, leverage, perpetuals, or broadcast functionality exists. Any future spot execution must require explicit user approval.

See [Developer Experience diary](docs/devex/README.md) for evidence and limitations.

## Reference Truth Engine

Visit `/demo` for **DEMO — SYNTHETIC DATA** scenarios. This separate route requires no Binance connectivity. It uses a frozen fictional clock and never represents real prices, issuers, liquidity or quotes.

The pure engine validates evidence and returns WAIT, MONITOR or PROCEED_TO_REVIEW. Review requires fresh independent references and matching execution evidence; it cannot trigger execution. Missing data fails closed. See [rules, defaults, test coverage and limitations](docs/devex/reference-truth-engine.md).
