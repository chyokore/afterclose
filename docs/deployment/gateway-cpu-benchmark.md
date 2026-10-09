> Historical AfterClose milestone/runbook. Current release: [Cloudflare + Supabase](public-live-release.md); current judge path: [proof index](../submission/proof-index.md). Historical commands are not authorization to deploy or alter accounts.

# Extracted gateway CPU sizing

2026-10-07, Windows, Node v24.21.0. Reproduce with `node --conditions=react-server --import tsx scripts/benchmark-gateway-cpu.ts`. Source gateway, engine and receipt are unchanged from the diagnostic base. No Next server or React rendering participates. This is not the earlier full-Next ~243 ms benchmark.

The script replaces fetch completely, uses dummy credentials and historical regression inputs, synthesizes a 500-token sizing catalog, and performs zero external requests. Synthetic timestamps are used solely for offline execution sizing; no benchmark receipt is saved or presented as genuine evidence. There is no provider/network fallback.

For each workload: 15 warmups, then 300 fresh-handler requests in 30 batches of 10. Fresh handlers force metadata/cache misses. A receipt-integrity assertion follows every request outside the measured total. [JSON results](gateway-cpu-benchmark.json) contain nearest-rank median/p90/max both per request and across batch means, plus all batch rows. The first-request sample excludes module loading and is not a complete cold-start benchmark.

## Total CPU proxy and wall time

Values below are median / p90 / max in milliseconds across **30 batch means**. These maxima are not individual-request maxima.

| Workload | Process CPU | Elapsed wall |
|---|---|---|
| Four-token fixture, 3,267-byte catalog | 10.9 / 17.3 / 18.9 | 17.199 / 22.480 / 33.831 |
| Synthetic 500-token catalog, 396,391 bytes | 31.2 / 36.1 / 40.7 | 47.742 / 69.111 / 88.232 |

Individual small-fixture CPU: 15 / 31 / 48 ms; wall: 15.137 / 30.110 / 79.404 ms. Windows process CPU is quantized, so batch means are more useful for sizing than individual values. First request: 296 ms process CPU, 293.363 ms wall.

## Isolated stages

Small-fixture individual-request elapsed timings, median / p90 / max milliseconds:

| Stage | Median | p90 | Max |
|---|---:|---:|---:|
| Observation schema normalization probe | 0.125 | 0.210 | 45.601 |
| Provider JSON parsing | 0.153 | 0.218 | 12.304 |
| Reference Truth Engine | 0.092 | 0.149 | 10.176 |
| Receipt canonical JSON | 1.296 | 3.125 | 61.214 |
| SHA-256 | 0.253 | 0.382 | 25.994 |
| Complete receipt creation | 3.666 | 9.236 | 63.517 |

Stage timers are elapsed time, not dedicated-thread CPU; scheduler/GC interruptions contribute to maxima. Schema probe is outside total timing and covers observation validation/normalization only; full receipt normalization remains inside receipt creation. Receipt time includes engine/canonicalization/hash, so do not sum overlapping metrics. Process CPU includes Node native work and mock payload construction, not exclusively JavaScript instructions. It excludes provider network wait because the primary measurement has no network. It is not Workers billed CPU and does not predict a different host's processor speed.

## Network separation and limitations

The optional 50 ms per-fetch timer experiment produced 203.144 ms wall and 296 ms process CPU. Summed fetch-header timings were 644.073 ms because calls overlap. This is deliberately NOT reported as actual network latency or subtracted from wall time: process-wide CPU/background runtime work and scheduler effects make that calculation invalid. Mock creation/serialization is included in the CPU proxy; real TLS/DNS and successful issuer HTML parsing are excluded (issuer returns an offline 503).

The historical five genuine local gateway samples separately measured wall median 1,102.276 ms, p90/max 3,463.998 ms and roughly 12.7 KB responses. Those are network-inclusive local observations, not measurements on any proposed host. No new Binance call occurred here.

**Workers Free sizing decision: FAIL conservative fit gate.** Its documented 10 ms CPU budget has no comfortable headroom even for the tiny fixture and is exceeded by expanded input. This local proxy does not prove exact workerd billing or a hard lower bound. Separately, Free compliant execution/egress cannot be established, so a hosted CPU experiment would not make it eligible. No deployment or optimization/rewrite is justified by this research.

Validation: 35 targeted authentication/gateway/competition tests passed; benchmark script ESLint passed. Both workloads' receipt-integrity assertions passed. No production source change was needed.
