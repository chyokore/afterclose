# Judging scorecard

Official basis: [BNB Hack: Tokenized Stocks Edition](https://www.bnbchain.org/en/hackathons/tokenized-stocks), reviewed October 6, 2026. This is an evidence audit, not a predicted score or an eligibility certification.

## Prompt 20 deployment update

**IMPLEMENTED:** Secure deployment-readiness controls and local validation at application commit `a62b1ffb8742c651b9449317e80963c9e3c0a5f6`: explicit production mode, fail-closed configuration, fixed provider operations, shared refresh limits, safe health/build identity, and 152 passing tests. These are local results, not hosted proof.

**REMAINING OPPORTUNITY:** Public LIVE hosting and fresh hosted verification remain incomplete. The owner-authorized Render preflight stopped before service creation because the current Hobby workspace has an existing payment method and explicitly bills usage beyond included limits. No compliant no-paid-overages path was established. See the [deployment record](../deployment/render-live-deployment-record.md). No live URL, hosted receipt, hosted connectivity, cold-start timing or hosted 90-second rehearsal is claimed. The existing public synthetic fallback remains unchanged.

| Dimension | Implemented evidence | Weakness | Highest-value remaining improvement | Judge-verifiable proof |
| --- | --- | --- | --- | --- |
| Technical implementation — 30% | Authenticated RWA discovery, token/market reads and supported-chain module; audited failures; separate clocks; canonical engine; digest verification and persisted snapshot | Six endpoints are chiefly one data module, not six independent modules. Independent equity, dated multiplier, route/simulation unavailable; live hosting local only | Secure separately hosted live service, then owner-authorized genuine execution-context research if scope later permits | `/live` request inspector; [frozen genuine capture](captured-evidence.json); offline verifier; `tests/competition.test.ts` |
| Creativity/originality — 25% | Temporal provenance and refusal logic distinguish token-derived references from independent equity. Raw clocks survive hashing; normalization is withheld until multiplier applicability is established | Reproducible receipt is locally generated, not provider-signed; no claim that hashes or price dashboards are novel by themselves | Demonstrate a real stale-reference episode with the same transparent evidence gates and independently qualified timestamps | Inspect receipt priceAt vs observedAt; stale-reference/fresh-evidence scenarios; engine input exclusions |
| Developer Experience — 25% | Existing diary retains DNS, VPN scope, TLS chain, Windows CA, schema mismatch, successful API calls, source/entitlement research, execution blockers and hosting limits | The new engineering log is AI-assisted and cannot be the final submitted experience report | Owner writes and verifies their own experience, precise pain points and suggested platform fixes using the logged evidence | [Engineering log](../devex/live-competition-upgrade.md), linked older diaries, actual audit timings and failed chain integration |
| Product quality — 20% | Explicit LIVE EVIDENCE and SCENARIO LAB; WAIT rationale; expandable provenance; copyable receipt; historical snapshot; responsive layout | 30/90-second comprehension is a design target, not a measured human result; long provenance table is detailed | Timed judge rehearsal with a newcomer, record misunderstandings; then a ≤4-minute demo if desired | [90-second path](90-second-demo-path.md); local browser QA, mobile screenshots and failure-state checks in validation log |

## Submission-impact gaps

1. **Eligibility/owner action:** official track wording includes a small live-amount demonstration on BSC. This milestone explicitly prohibits transactions, so it cannot establish that requirement. Obtain organizer clarification about a read-only research submission; no transaction is authorized by this scorecard.
2. **Owner-authored report:** the rules reject AI-generated developer experience reports while permitting AI-assisted code. This file and the engineering diary are supporting records, not a report to submit as personal experience.
3. **Live accessibility:** only the separate synthetic fallback is public. Follow local run instructions for now; a separate secure hosted live service would reduce judging friction.
4. **Independent reference and issuer history:** no confirmed $0 public reference entitlement or dated multiplier. These prevent a defensible current normalized comparison. Two independent providers remain required.
5. **Execution evidence:** no wallet context, route, depth, impact or simulation has been tested. WAIT is correct; module breadth must not be overstated.
6. **Usability measurement:** automated viewport/interaction checks cannot measure human comprehension or guarantee the 90-second target.

Competition dates are September 16–October 11, 2026. No registration, submission, video recording, purchase, message to organizers or hosted deployment was performed during this milestone.
