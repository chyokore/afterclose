import { evaluateReferenceTruth } from "@/lib/reference-truth/engine";
import type { TruthInput } from "@/lib/reference-truth/models";

import { timestampLabel } from "@/lib/evidence/presentation";

const age = (ms: number | null) => ms === null ? "Unknown" : `${(ms / 1000).toFixed(1)} seconds`;
const amount = (value: number | null | undefined) => value == null ? "Unavailable" : value.toLocaleString("en-US", { maximumFractionDigits: 6 });

type ComparisonProps = { evidence: TruthInput; nowMs: number };
export function ReferenceComparison({ evidence, nowMs }: ComparisonProps) {
  const result = evaluateReferenceTruth(evidence, nowMs);
  const synthetic = evidence.mode === "synthetic";
  return <section className="truth-panel" aria-labelledby="truth-title">
    {synthetic && <div className="demo-banner">SYNTHETIC SCENARIO — NOT LIVE MARKET DATA</div>}
    <div className="eyebrow">02 / REFERENCE TRUTH ENGINE</div><h2 id="truth-title">The decision, with its evidence.</h2>
    <p>{evidence.token?.name ?? "Token unavailable"} · {evidence.underlying?.company ?? "Underlying unavailable"}</p>
    <p className="truth-state" role="status">{result.decision}</p>
    <p>{result.decision === "PROCEED_TO_REVIEW" ? "Configured checks pass for review only. No trade is proposed or executed by this component." : result.decision === "MONITOR" ? "A comparison is available, but this scenario does not qualify for review." : "Critical evidence is missing, invalid, stale or fails a configured check."}</p>
    <div className="comparison-table"><table><caption>Price evidence and separate freshness clocks</caption><thead><tr><th>Evidence</th><th>Price</th><th>Provider price age</th><th>Source</th></tr></thead><tbody>
      <tr><th>Token · per token</th><td>{amount(evidence.tokenPrice?.price)} {evidence.tokenPrice?.currency}</td><td>{age(result.tokenPriceAgeMs)}<br /><small>{timestampLabel(evidence.tokenPrice?.priceAt?.unixMs)}</small></td><td>{evidence.tokenPrice?.provenance.provider.name ?? "Unavailable"}</td></tr>
      {evidence.references.length === 0 && <tr><th>Independent equity · per share</th><td>Unavailable</td><td>Unavailable</td><td>No independent provider connected</td></tr>}
      {evidence.references.map((ref, i) => <tr key={`${ref.provenance.provider.id}-${i}`}><th>Equity · per share</th><td>{amount(ref.price)} {ref.currency}</td><td>{age(result.referenceAgesMs[i])}<br /><small>{timestampLabel(ref.priceAt?.unixMs)}</small></td><td>{ref.provenance.provider.name}<br /><small>{ref.basis}</small></td></tr>)}
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
    <h3>Engine check results</h3>{result.findings.length === 0 && <p>All configured engine checks passed. Review only; execution stays disabled.</p>}
    {result.findings.length > 0 && <ul className="truth-findings">{result.findings.map((f, i) => <li key={`${f.code}-${i}`}><code>{f.code}</code> <strong>{f.severity === "blocking" ? "Blocking" : "Monitor"}:</strong> {f.message}</li>)}</ul>}
    <p className="fine">A displayed gap may be based on stale evidence; use the decision and warnings above. Observation time never substitutes for the underlying price timestamp. A gap does not guarantee arbitrage, profit or execution.</p>
    <p className="fine">{synthetic ? "Frozen synthetic evaluation time" : "Evaluation time"}: {new Date(nowMs).toISOString()}. Execution is disabled. Any future spot trade requires separate explicit user approval.</p>
  </section>;
}
