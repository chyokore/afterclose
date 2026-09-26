import Link from "next/link";
import { evaluateReferenceTruth } from "@/lib/reference-truth/engine";
import type { TruthInput } from "@/lib/reference-truth/models";

const age = (ms: number | null) => ms === null ? "Unknown" : `${(ms / 1000).toFixed(1)} seconds`;
const amount = (value: number | null | undefined) => value == null ? "Unavailable" : value.toLocaleString("en-US", { maximumFractionDigits: 6 });

type ComparisonProps = { evidence: TruthInput; nowMs: number } | { evidence?: undefined; nowMs?: never };
export function ReferenceComparison({ evidence, nowMs }: ComparisonProps) {
  if (!evidence) return <section className="truth-panel" aria-labelledby="truth-title">
    <div className="eyebrow">REFERENCE TRUTH ENGINE</div>
    <h2 id="truth-title">Independent comparison unavailable</h2>
    <p className="truth-state">WAIT · Connection / evidence unavailable</p>
    <p>No complete live evidence bundle is connected to this engine. Independent equity prices, their original timestamps, liquidity and an executable quote are required before review.</p>
    <Link className="truth-link" href="/demo">Explore the labeled synthetic scenarios ↗</Link>
  </section>;
  const result = evaluateReferenceTruth(evidence, nowMs);
  const synthetic = evidence.mode === "synthetic";
  return <section className="truth-panel" aria-labelledby="truth-title">
    {synthetic && <div className="demo-banner">DEMO — SYNTHETIC DATA</div>}
    <h2 id="truth-title">Reference comparison</h2>
    <p>{evidence.token?.name ?? "Token unavailable"} · {evidence.underlying?.company ?? "Underlying unavailable"}</p>
    <p className="truth-state" role="status">{result.decision}</p>
    <p>{result.decision === "PROCEED_TO_REVIEW" ? "Configured checks pass for review only. No trade is proposed or executed by this component." : result.decision === "MONITOR" ? "A comparison is available, but this scenario does not qualify for review." : "Critical evidence is missing, invalid, stale or fails a configured check."}</p>
    <div className="comparison-table"><table><caption>Price evidence and separate freshness clocks</caption><thead><tr><th>Evidence</th><th>Price</th><th>Provider price age</th><th>Source</th></tr></thead><tbody>
      <tr><th>Token · per token</th><td>{amount(evidence.tokenPrice?.price)} {evidence.tokenPrice?.currency}</td><td>{age(result.tokenPriceAgeMs)}</td><td>{evidence.tokenPrice?.provenance.provider.name ?? "Unavailable"}</td></tr>
      {evidence.references.map((ref, i) => <tr key={`${ref.provenance.provider.id}-${i}`}><th>Equity · per share</th><td>{amount(ref.price)} {ref.currency}</td><td>{age(result.referenceAgesMs[i])}</td><td>{ref.provenance.provider.name}<br /><small>{ref.basis}</small></td></tr>)}
    </tbody></table></div>
    <dl className="truth-metrics">
      <div><dt>Shares per token</dt><dd>{amount(evidence.multiplier?.sharesPerToken)}</dd></div>
      <div><dt>Normalized token price / share</dt><dd>{amount(result.normalizedTokenPrice)}</dd></div>
      <div><dt>Median independent reference</dt><dd>{amount(result.referenceConsensusPrice)}</dd></div>
      <div><dt>Normalized gap</dt><dd>{result.normalizedGapBps === null ? "Unavailable" : `${(result.normalizedGapBps / 100).toFixed(2)}%`}</dd></div>
      <div><dt>Provider disagreement</dt><dd>{result.providerDisagreementBps === null ? "Unavailable" : `${result.providerDisagreementBps.toFixed(2)} bps`}</dd></div>
      <div><dt>AfterClose observation age</dt><dd>{age(result.observationAgeMs)}</dd></div>
      <div><dt>Underlying session</dt><dd>{result.session}</dd></div>
      <div><dt>Available liquidity</dt><dd>{amount(evidence.liquidity?.availableNotional)} {evidence.liquidity?.currency}</dd></div>
      <div><dt>Quote estimated slippage</dt><dd>{evidence.quote ? `${evidence.quote.estimatedSlippageBps} bps` : "Unavailable"}</dd></div>
    </dl>
    {result.findings.length > 0 && <ul className="truth-findings">{result.findings.map((f, i) => <li key={`${f.code}-${i}`}><strong>{f.severity === "blocking" ? "Blocking" : "Monitor"}:</strong> {f.message}</li>)}</ul>}
    <p className="fine">A displayed gap may be based on stale evidence; use the decision and warnings above. Observation time never substitutes for the underlying price timestamp. A gap does not guarantee arbitrage, profit or execution.</p>
    <p className="fine">{synthetic ? "Frozen synthetic evaluation time" : "Evaluation time"}: {new Date(nowMs).toISOString()}. Execution is disabled. Any future spot trade requires separate explicit user approval.</p>
  </section>;
}
