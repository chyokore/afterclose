import Link from "next/link";
import { previewMode } from "@/lib/preview-mode";
import { ReferenceComparison } from "@/components/reference-comparison";
import { DEMO_NOW, scenarioNames, syntheticFixture, type Scenario } from "@/demo/reference-fixtures";

export const metadata = { title: "AfterClose | Synthetic engine scenarios" };
export default async function DemoPage({ searchParams }: { searchParams: Promise<{ scenario?: string }> }) {
  const mode = previewMode();
  const { scenario: requested } = await searchParams;
  const scenario: Scenario = requested && Object.hasOwn(scenarioNames, requested) ? requested as Scenario : "stale-reference";
  return <main id="main-content" className="demo-page">
    <header className="nav"><Link className="brand" href="/" prefetch={false}>AfterClose</Link><span className="network">SCENARIO LAB · SYNTHETIC</span></header>
    <div className="demo-intro"><div className="demo-banner">SYNTHETIC SCENARIO — NOT LIVE MARKET DATA</div><h1>Test the evidence.<br /><span>Not the market.</span></h1><p>All companies, providers, contracts, prices, sessions, liquidity and quotes here are fictional test inputs. Session values are fictional inputs, not a calendar inference. This page makes no Binance requests and does not represent actual market conditions.</p></div>
    <p className="demo-guide">One-minute tour: start with <Link href="/demo?scenario=stale-reference">a stale reference</Link>, compare <Link href="/demo?scenario=fresh-evidence">complete fictional evidence</Link>, then remove <Link href="/demo?scenario=missing-multiplier">multiplier validity</Link>. Review eligibility is never a profit guarantee.</p>
    {requested && requested !== scenario && <p role="status">Unknown scenario requested. Showing the labeled stale-reference demonstration.</p>}
    <nav className="scenario-list" aria-label="Synthetic scenarios">{Object.entries(scenarioNames).map(([id, title]) => <Link key={id} href={`/demo?scenario=${id}`} aria-current={id === scenario ? "page" : undefined}>{title}</Link>)}</nav>
    <h2 className="scenario-heading">{scenarioNames[scenario]}</h2>
    <ReferenceComparison evidence={syntheticFixture(scenario)} nowMs={DEMO_NOW} />
    <footer><Link href={mode === "live" ? "/live" : "/"} prefetch={false}>{mode === "live" ? "← Open LIVE EVIDENCE" : "← Back to AfterClose"}</Link><p>Research defaults are illustrative, not calibrated trading recommendations.</p></footer>
  </main>;
}
