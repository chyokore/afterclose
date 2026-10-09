> Historical AfterClose milestone/runbook. Current release: [Cloudflare + Supabase](public-live-release.md); current judge path: [proof index](../submission/proof-index.md). Historical commands are not authorization to deploy or alter accounts.

# Cloudflare live integration after gateway verification

Preferred architecture B keeps `https://afterclose-preview.pages.dev/` as the judge entry. Its existing deployed content is unchanged in Prompt 21. Local `gateway-preview/` demonstrates the integration and copies the original static bundle byte-for-byte under `lab/`; it is not a new public deployment.

## Release gates

Require explicit authorization, a verified credit-based Netlify Free account, and successful hosted gateway checks from [the owner checklist](netlify-owner-checklist.md). Freeze the gateway URL, source fingerprint and immutable deployment ID. Do not ship the localhost rehearsal endpoint to Cloudflare.

## Exact future changes

1. Retain the original static Scenario Lab build at `/lab/` with all twelve hash routes, fictional labels, frozen evaluation time and `connect-src 'none'`. Preserve direct existing scenario links with a reviewed static redirect/route migration. Keep a recoverable copy of the current six-file deployment before changing paths.
2. Add top-level **LIVE EVIDENCE / SCENARIO LAB** navigation and the small Live page demonstrated by `gateway-preview/index.html`, `live.ts` and `live.css`. Keep Scenario Lab accessible directly and when JavaScript/network/live services fail. Navigation remains ordinary local links, without a dependency on gateway availability.
3. Replace the single hardcoded local API URL with the verified HTTPS Netlify `/api/live-evidence` URL in a reviewed public configuration module. This is a public endpoint, not a secret. Add only its exact HTTPS origin to the Live page's `connect-src`; do not widen the Scenario Lab policy or use wildcards. Verify `_headers` matches the page CSP and does not accidentally retain an incompatible blanket `connect-src 'none'` for Live. Add no Binance domain, credential, proxy URL parameter or signed URL to browser code.
4. GET with `credentials: omit`, no authorization/custom headers, no polling, and a 30-second browser timeout. Loading explicitly says it is fetching current Binance Web3 evidence. Render only a successful schema-versioned response with a verified receipt digest. Escape provider strings before DOM insertion; never trust markup in evidence. Do not compute a competing browser verdict.
5. Display classification **at evaluation**, original provider/observation/evaluation clocks, both ages, PARTIAL/WAIT, blockers and limitations. A local elapsed timer reports how old that fixed evaluation is; it does not refresh evidence, mutate receipt clocks or claim the current market remains LIVE. Manual refresh asks the gateway to re-evaluate; cache hits retain original observations. Show metadata provenance and the full receipt through disclosure.
6. On HTTP error, timeout, wrong schema or bad digest, clear current live values and show `LIVE_EVIDENCE_UNAVAILABLE`. Never carry a previous price forward as LIVE, silently use a historical snapshot or substitute fictional Scenario Lab values. Always offer the independent Scenario Lab link.
7. Keep the final comparison explicit: genuine incomplete evidence yields WAIT; the fictional complete-evidence case may yield PROCEED_TO_REVIEW. No wallet, order submission, simulation, execution or new provider integration is introduced.
8. Before release, repeat local and hosted separate-origin browser QA at 1440/390/320: load, receipt SHA, refresh clocks/cache, denied origins, failure, offline Scenario Lab and complete case. Scan the exact candidate frontend bundle and any source maps for credential values, secret names and authentication material. Ensure the final build has no localhost URL.
9. Only with separate Cloudflare deployment authorization publish the reviewed static candidate. If either Netlify or Binance fails, Scenario Lab still serves entirely from Cloudflare. Roll back the static candidate without changing the canonical engine or deployed gateway. No existing Cloudflare deployment was modified for this rehearsal.

## Local reproduction

With installed dependencies and Node 24:

```text
node scripts/build-static-preview.mjs
node scripts/build-gateway.mjs
node scripts/build-gateway-preview.mjs
node scripts/serve-gateway.mjs
```

The local adapter loads owner credentials only into its process. Open `http://127.0.0.1:4173`; the function runs at the distinct origin `http://127.0.0.1:4174`. Stop the adapter and restart with `--unavailable` to exercise missing credentials without changing `.env.local`. This flag belongs only to the local adapter and is absent from the deployed function.
