import Link from "next/link";
import { toReferenceEvidence } from "@/lib/binance/reference-adapter";
import { ReferenceComparison } from "@/components/reference-comparison";
import { loadRwa } from "@/lib/binance/rwa";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const data = await loadRwa();
  const label = { setup: "Setup required", connected: "API verified this request", empty: "Connected · no eligible stock found", error: "Setup required · connection unavailable" }[data.state];
  return (
    <main>
      <header className="nav"><Link className="brand" href="/" aria-label="AfterClose home"><span className="brand-icon">a/c</span>AfterClose<span className="beta">RESEARCH PREVIEW</span></Link><span className="network"><i /> BSC MAINNET <span>56</span></span></header>
      <section className="hero">
        <div className="eyebrow">AFTER THE BELL. BEFORE THE DECISION.</div>
        <h1>Don&apos;t trade the gap.<br /><span>Understand it first.</span></h1>
        <p className="intro">A different price doesn&apos;t tell the whole story. Explore tokenized stocks on BNB Smart Chain with the context behind the number.</p>
        <a className="button" href="#workspace">Explore the research workspace <span>↗</span></a>
        <div className="hero-note">Independent research tool · Spot markets only</div>
      </section>
      <section id="workspace" className="workspace">
        <div className="section-top"><div><div className="eyebrow">01 / DATA WORKSPACE</div><h2>Start with what we know.</h2></div><span className={`status ${data.state === "connected" ? "verified" : ""}`} role="status">{label}</span></div>
        {data.state === "connected" ? <div className="connected-panel">
          <div className="asset-title"><h3>{data.token.tokenSymbol}</h3><span>{data.token.platformId} / BSC</span></div>
          <p>{data.token.tokenName} · {data.token.underlyingName ?? "Company unavailable"} ({data.token.underlyingTicker})</p>
          <p>Decimals: {data.token.decimals ?? "Unavailable"} · Provider-reported shares per token: {data.token.tokenToShareRatio ?? "Unavailable"}</p>
          <p className="fine">Live Binance data. API-reported contract; indexed BscScan metadata corroborates it, but fresh independent verification was blocked (HTTP 403). <a href={`https://bscscan.com/token/${data.token.tokenContractAddress}`}>View BscScan</a></p><p className="contract">{data.token.tokenContractAddress}</p>
          <div className="metrics"><div><small>Token price · USD</small><strong>{data.quote.tokenPrice ?? "Unavailable"}</strong></div><div><small>Token-derived per-share reference · USD</small><strong>{data.quote.referencePrice ?? "Unavailable"}</strong></div><div><small>Provider market status</small><strong>{data.market.statusInfo?.marketStatus ?? "Unknown"}</strong></div></div>
          <p className="fine">Underlying-market endpoint reference: {data.market.marketData?.referencePrice ?? "Unavailable"} USD (token-derived). USD units come from Binance documentation, not a currency field. Independent equity quote and timestamp: unavailable. The reported ratio has no validity interval; it is not used for normalized gap calculations. Provider status “offhours” has no documented engine-session mapping and remains unknown.</p>
          <p className="fine">Retrieved {data.fetchedAt}. Retrieval time is not the underlying quote time. Token price timestamp: {data.quote.tokenPriceUpdatedAt ?? "unavailable"} (Unix ms).</p>
        </div> : <div className="setup-panel"><div className="setup-symbol">⌁</div><div><h3>{data.state === "setup" ? "Your data connection starts here." : data.state === "empty" ? "No eligible BSC stock returned." : "We couldn’t verify the data connection."}</h3><p>{data.state === "setup" ? "Add your Binance Web3 API credentials on the server to discover supported Ondo and bStocks assets. No market prices are shown until real responses are verified." : data.state === "empty" ? "The API responded, but no matching Ondo or bStocks stock token was found on chain 56. No substitute asset has been selected." : data.state === "error" && data.reason === "network" ? "The server could not reach Binance Web3. Authentication and BSC token support remain unverified. Check network connectivity and DNS, then rerun the API diagnostic. No market data is shown." : "Market data is withheld. Check the server configuration and run the API diagnostic again."}</p>{data.state === "setup" && <details><summary>Connection setup</summary><ol><li>Copy <code>.env.example</code> to <code>.env.local</code>.</li><li>Set <code>BINANCE_API_KEY</code> and <code>BINANCE_SECRET_KEY</code> locally. Keep both private.</li><li>Run <code>npm run test:api</code>, then restart the app.</li></ol></details>}</div></div>}
        <div className="data-caveat"><span>REFERENCE FRESHNESS</span><p>Unknown. Binance&apos;s documented reference is derived from the token price; it is not an independent stock-market quote. No genuine underlying-price timestamp is documented. A price-discovery signal cannot be established from this data alone.</p></div>
      </section>
      {data.state === "connected" ? <ReferenceComparison evidence={toReferenceEvidence(data)} nowMs={Date.parse(data.fetchedAt)} /> : <ReferenceComparison />}
      <section className="research"><div className="eyebrow">02 / THE QUESTIONS THAT MATTER</div><div className="cards">{[
        ["01", "Is the reference current?", "A stale reference can make an ordinary move look like an opportunity. Source and timestamp come first."],
        ["02", "Does the market agree?", "Market hours and differences between providers help explain the context behind a token price."],
        ["03", "Can the price be executed?", "Liquidity, slippage, and executable quotes belong in the analysis. These checks are planned, not yet connected."],
      ].map(([number, title, text]) => <article key={number}><span className="card-number">{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <footer><span className="brand">AfterClose</span><p>Built for clearer questions. No trading or transaction execution in this preview.</p><a href="https://github.com/chyokore/afterclose">Project & development diary ↗</a></footer>
    </main>
  );
}
