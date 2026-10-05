import Link from "next/link";
import { DEMO_NOW, syntheticFixture } from "@/demo/reference-fixtures";
import { ReferenceComparison } from "./reference-comparison";
import { RefreshEvidence } from "./refresh-evidence";

export function SyntheticDashboard() {
  return <main id="main-content" className="evidence-dashboard">
    <header className="nav"><Link className="brand" href="/">AfterClose</Link><Link href="/demo">Scenario lab →</Link></header>
    <section className="demo-intro"><h1>Evidence first.<br />Synthetic preview.</h1>
      <p>Fictional Example Company / EXAMPLE. Every price, provider, contract, session and quote check is a fictional test input. No wallet or execution is available.</p>
      <p>Frozen evaluation clock: {new Date(DEMO_NOW).toISOString()}. Refresh repeats the same synthetic scenario; it does not obtain market data.</p>
      <RefreshEvidence synthetic />
    </section>
    <ReferenceComparison evidence={syntheticFixture("stale-reference")} nowMs={DEMO_NOW} />
    <footer><Link href="/demo">Explore all 12 synthetic scenarios →</Link><p>Research demonstration only. No trade is proposed or executed.</p></footer>
  </main>;
}
