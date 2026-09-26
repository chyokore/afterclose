# Demo and deployment readiness — September 26, 2026

Starting commit: e2316a474d89b8eb826ffe8deeafda6798dd368e. AfterClose only.

Audit found outdated README claims about DNS/schema failures, generic live error guidance, ambiguous engine-versus-reported multiplier labels and a snapshot banner that could be read as continuously live. Added a brief product explanation, direct scenario CTA, explicit WAIT/review disclaimers, controlled failure messages, loading/error routes, keyboard-accessible tables and a historical-snapshot notice. No evidence rules, synthetic values or financial validity claims changed.

Added loader regressions for synthetic timeout (including response-body timeout), access rejection, quota and schema/provider errors, plus missing price and historical notices. Existing issuer, calendar, missing reference/quote and synthetic isolation tests remain in place. Failure tests intentionally use fake responses and do not claim actual live Binance rejections.

The first 83-test run, lint and production build passed. Final review then corrected timeout classification during body reading and skip-link targets in loading/error states; validation was repeated. A PowerShell text-edit attempt failed on quoting before modifying its target; the intended UI edit was applied with a structured patch instead.

Browser attachment succeeded, unlike the prior milestone. Desktop 1440 × 1000 and mobile 390 × 844 / 320 × 780 were inspected; dashboard and lab had no page-level horizontal overflow. Internal table scrolling and visible keyboard focus worked. The 30-second historical notice transitioned in the real browser. Loading was observed before the live dashboard appeared. Saved actual screenshots and a precise manual checklist in the [QA record](../qa/demo-readiness.md). These are bounded visual smoke checks, not a full accessibility certification.

Rewrote README to reflect current RWA/issuer/calendar evidence and unresolved dependencies. Added a [deployment runbook](../deployment.md) using official Next.js/Vercel sources. No host/account/deployment was created. Node compatibility does not prove hosted Binance connectivity, data display entitlement or traffic readiness. There is still no distributed rate limiter/shared cache.

AI assistance: OpenAI Codex audited this repository, consulted official hosting documentation, implemented and tested the targeted changes, inspected browser layouts and captured screenshots, and prepared documentation. No other project files or credentials were accessed. No wallet connection or execution was implemented.

Final validation: all 83 tests passed, lint passed, and the production build passed after the last fixes. The restarted local build returned HTTP 200, WAIT and the snapshot-specific Binance label. Browser console error count was zero. Credential-value scans found zero matches in rendered HTML and across 80 repository/browser-asset files; .env.local remains ignored. Production-source audit found environment access only in the server-only Binance client and no localhost navigation. The whitespace diff check passed.
