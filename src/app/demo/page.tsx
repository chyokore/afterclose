import Link from "next/link";
import { ReferenceComparison } from "@/components/reference-comparison";
import { DEMO_NOW, scenarioNames, syntheticFixture, type Scenario } from "@/demo/reference-fixtures";

export const metadata = { title: "AfterClose | Synthetic engine scenarios" };
export default async function DemoPage({ searchParams }: { searchParams: Promise<{ scenario?: string }> }) {
  const { scenario: requested } = await searchParams;
  const scenario: Scenario = requested && Object.hasOwn(scenarioNames, requested) ? requested as Scenario : "stale-reference";
  return <main className="demo-page">
    <header className="nav"><Link className="brand" href="/">AfterClose</Link><span className="network">ENGINE LAB</span></header>
    <div className="demo-intro"><div className="demo-banner">SYNTHETIC SCENARIO — NOT LIVE MARKET DATA</div><h1>Test the evidence.<br /><span>Not the market.</span></h1><p>All companies, providers, contracts, prices, sessions, liquidity and quotes here are fictional test inputs. Session values are fictional inputs, not a calendar inference. This page makes no Binance requests and does not represent actual market conditions.</p></div>
    <nav className="scenario-list" aria-label="Synthetic scenarios">{Object.entries(scenarioNames).map(([id, title]) => <Link key={id} href={`/demo?scenario=${id}`} aria-current={id === scenario ? "page" : undefined}>{title}</Link>)}</nav>
    <h2 className="scenario-heading">{scenarioNames[scenario]}</h2>
    <ReferenceComparison evidence={syntheticFixture(scenario)} nowMs={DEMO_NOW} />
    <footer><Link href="/">← Back to AfterClose</Link><p>Research defaults are illustrative, not calibrated trading recommendations.</p></footer>
  </main>;
}
