> Historical AfterClose milestone/runbook. Current release: [Cloudflare + Supabase](public-live-release.md); current judge path: [proof index](../submission/proof-index.md). Historical commands are not authorization to deploy or alter accounts.

# Binance Web3 region requirements

Verified 2026-10-07 against [Binance's official service restrictions](https://web3.binance.com/en/dev-docs/web3-api-prohibited-regions), modified 2026-10-01.

Binance states: “IP checks are enforced on both the Developer Portal and the API server side.”

The prohibited list comprises United States, Guam, Northern Mariana Islands, Puerto Rico, U.S. Virgin Islands, American Samoa, U.S. Minor Outlying Islands, Canada, Netherlands, Iran, Cuba, North Korea, Crimea, Donetsk People's Republic, Luhansk People's Republic, United Kingdom, and conditionally Japan.

Japan requires Binance-account authentication, KYC outside the prohibited list, and a Japanese server IP simultaneously. Other prohibited locations have no exemption; Binance checks client IP and server location. This project does not pursue the Japan exception.

There is no affirmative approved-country list on this page. Germany and Singapore are absent from the prohibited list; this makes them candidates by exclusion, not guaranteed account/API acceptance. Account eligibility still applies. Do not use hosting to bypass a client-location restriction.

For AfterClose, the relevant origin is the gateway's outbound connection to Binance. Frontend CDN, build location and database region do not prove this. Require execution configuration plus outbound-origin evidence before enabling credentials. Reject unknown or prohibited egress. Do not use proxies, VPNs or header spoofing to circumvent restrictions.

The existing Ohio Netlify function is unsuitable. The meaning of historical error `40304` remains unknown; this document does not attribute it to geography.
