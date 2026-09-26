# Improvement proposals — September 26, 2026

Latest finding: make transport failure distinct from provider authentication failure in developer diagnostics. AfterClose now records allowlisted DNS/timeout codes and request latency. The network failure does not justify changing signing, rotating credentials or claiming the provider rejected access. Next action is restoring host reachability and rerunning live verification.

1. **Reference provenance:** Give token-derived reference prices an unambiguous field name and expose independent market quotes separately. Current documentation makes the derivation clear, but the field name can suggest a traditional quote.
2. **Reference freshness:** If an independent underlying quote becomes available, expose its source, exchange session, observed-at timestamp and delay classification. Response timestamps cannot establish freshness.
3. **Schema consistency:** The documented token-list decimals field is described as a string but its example is numeric. Publish examples validated against the downloadable schema. Our implementation does not consume this field.
4. **Authentication fixtures:** Publish fixed non-secret signing test vectors covering spaces, query ordering and the `/build` prefix, to support reproducible integration checks.
5. **Next milestone:** Configure independent AfterClose credentials, run all five GET probes, inspect real response fields, verify an actual issuer contract on BSC, and secure an independent underlying quote source before implementing gap analysis.

These proposals arise from documentation review and setup work, not invented API errors or user research.
