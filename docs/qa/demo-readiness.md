# Demonstration readiness and visual QA

September 26, 2026. Local production build only; no public deployment. Test URL: `http://127.0.0.1:3006/`, with `/demo` for fictional scenarios.

## Observed visual checks

Browser automation successfully attached to the existing in-app tab this milestone. The previous attachment timeout did not recur. Screenshots below are actual browser captures, not mockups. Market values in captures are historical observations at the displayed snapshot, never current quotes to reuse.

| Surface | Viewport | Observed result |
| --- | --- | --- |
| Dashboard | 1440 × 1000 | Intro, scenario CTA, WAIT card, snapshot explanation and product scope fit; page width 1425 within 1440 viewport |
| Dashboard | 390 × 844 | Stacked intro/evidence, readable wrapped source text; page width 375 within 390 viewport |
| Dashboard evidence | 320 × 780 | No page-level horizontal overflow (305 within 320); tables scroll inside their panels |
| Scenario lab | 1440 × 1000 | Twelve selectors, active stale-reference state and visible synthetic labeling; WAIT |
| Scenario lab | 320 × 780 | Synthetic banner wraps, selectors stack, PROCEED_TO_REVIEW label fits and states review-only/no profit guarantee |

Desktop and mobile visual smoke checks passed for these viewports. This is not a physical-device, screen-reader or complete WCAG certification. The browser capture is somewhat soft at desktop scale; layout and labels were also checked through the accessibility/DOM tree.

Keyboard testing focused the price evidence region with a visible outline; ArrowRight changed its internal horizontal scroll position. Tables have accessible region names and tabindex. A skip link and visible focus styles were added. Loading was observed before the real dashboard appeared and made no price/decision claim.

The historical-snapshot notice changed after the existing 30-second observation threshold without changing recorded prices, market timestamps or the displayed decision. The notice is display-only and does not poll an API. Engine checks remain frozen at their stated evaluation time.

## Captures

- [Desktop dashboard](screenshots/desktop-dashboard.png)
- [Mobile dashboard](screenshots/mobile-dashboard.png)
- [Mobile evidence and keyboard focus](screenshots/mobile-evidence.png)
- [Mobile synthetic review state](screenshots/mobile-review-state.png)
- [Desktop scenario lab](screenshots/desktop-lab.png)

## Failure checks and their provenance

| Case | Verification |
| --- | --- |
| Binance timeout before headers / during body | Synthetic transport regressions: controlled timeout state, no fallback data or secret text |
| Authentication/access rejection | Synthetic HTTP 401 and existing provider-code safeguards; controlled operator guidance |
| Rate limit | Synthetic HTTP 429; pause/review-quota guidance, no automatic retry |
| Schema failure | Synthetic wrong response shape; no quote accepted |
| Missing token price | Captured structure with test-only null price through real loader; metadata retained, engine WAIT |
| Historical observation | Deterministic boundary regression and actual browser notice transition |
| Missing issuer effective time | Existing issuer tests and live dashboard: unverified; not converted to engine multiplier |
| Missing independent quote / execution | Existing tests and dashboard: unavailable; live WAIT |
| Calendar expiry | Existing future/stale/missing/out-of-coverage tests retain unknown |
| Synthetic/live separation | Existing import/provenance regressions preserved; lab uses its frozen fictional clock |

No deliberate provider outage, credential rejection or quote was generated against live Binance. Simulated failure tests are not live service experiences. Unexpected-error UI was source reviewed; no real unexpected rendering crash was induced.

## Manual submission checklist

1. Start the validated production server, open the dashboard, and capture the top plus issuer/calendar and engine panels at 1440 × 1000, 390 × 844 and 320 × 780.
2. Verify no whole-page sideways scroll. Swipe/keyboard-scroll both tables; contract/ratio text must stay inside cards.
3. Use Tab from the address bar: skip link, scenario links, refresh, scrollable tables and source disclosures must show focus. Try Enter and arrow scrolling. Complete screen-reader review separately.
4. Wait more than 30 seconds: historical-snapshot notice appears; old ages/decision do not masquerade as newly evaluated data. Refresh and verify new snapshot time, or an honest unavailable state.
5. Open stale-reference, fresh-evidence, missing-multiplier and API-unavailable lab cases. Capture the synthetic banner, chosen case, decision and explanation together. No execution controls should appear.
6. On a separate credential-free local process, verify setup guidance and that the lab still works. Do not alter the real credential file to rehearse failures.
7. Confirm current Nasdaq review validity before recording a demo. If expired, preserve unknown until official sources are actually reviewed again. Never update only the review timestamp to look fresh.
8. Keep credentials, terminal environment dumps and authentication headers out of recordings. Obtain approval and provider/host readiness before public deployment.

Final build verification: 83 tests, lint and production build passed. The final server returned HTTP 200 with WAIT; browser console error count was zero. Desktop capture was refreshed after restarting the final build; the tested visual layouts were unchanged by the response-body timeout and loading/error anchor fixes.
