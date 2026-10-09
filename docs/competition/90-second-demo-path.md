> Historical local-application milestone. For the deployed static frontend and current verification path, use the [judge proof index](../submission/proof-index.md).

# A 90-second judge path

Target duration, not a measured user-study result. No video has been recorded. Start the full application locally using Node 24 and authorized server credentials, with `NODE_USE_SYSTEM_CA=1` on the existing Windows setup. Open `/live`. The public Pages link is still the separate synthetic fallback.

| Time | Action | What the judge can verify |
| --- | --- | --- |
| 0–10 seconds | Read NVDAon / NVDA and the main question | A token can update without a comparable current stock reference. AfterClose qualifies evidence rather than recommending BUY/SELL. |
| 10–25 | Read token status, price, provider update and received time | These clocks differ. LIVE describes the captured token evidence only; PARTIAL means the complete comparison remains unqualified. If current status is STALE/HISTORICAL, show it without refreshing away the lesson. |
| 25–40 | Expand provenance and six request results | Real Binance modules, HTTP/code/latency, exact contract, sources, undated references, excluded values. A current HTTP response does not make every field current. |
| 40–50 | Read WAIT and engine-generated blockers | Independent NVDA reference, dated multiplier and authoritative/execution evidence remain missing. No normalized gap is invented. |
| 50–65 | Open Evidence Receipt and copy JSON | The SHA-256 covers the canonical evidence and decision. Save JSON for the offline verification command below. Hashing is integrity/reproduction, not proof of provider authorship. |
| 65–80 | Use the explicit complete-synthetic-scenario link | The mode banner changes to SYNTHETIC. Complete fictional evidence yields PROCEED_TO_REVIEW; this is still not a trade. |
| 80–90 | Select missing multiplier or stale reference, then use Open LIVE EVIDENCE | Removing required evidence restores WAIT. Same engine, clearly separated sources/modes. |

If the provider fails, show LIVE EVIDENCE UNAVAILABLE. The separate Last verified snapshot is HISTORICAL with exact capture time, age and digest. State that it is a past observation, then explicitly open Scenario Lab. Do not describe the frozen committed receipt or the public synthetic preview as current market data.

Optional deeper verification, outside the timed path:

```text
node --conditions=react-server --import tsx scripts/verify-evidence-receipt.ts copied-receipt.json EXPECTED_DIGEST
```

`EXPECTED_DIGEST` is the separately displayed digest. The committed `docs/competition/captured-evidence.json` is also accepted. The verifier reproduces the receipt and engine output without credentials or network. Changing a price, timestamp or verdict makes the old digest fail.

For a real timed rehearsal, have a newcomer identify the asset, the two clocks, the missing reference and the reason for WAIT within 30 seconds. Then time receipt discovery/copy and mode switching. Record actual completion times and mistakes; do not substitute automated timings for comprehension. Check both a desktop and 390 px phone viewport.
