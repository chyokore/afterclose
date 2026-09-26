"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  // Do not render or log framework/provider error objects.
  return <main id="main-content" className="state-page"><h1>Evidence could not be displayed.</h1><p role="alert">The page encountered an unexpected error. No substitute market data is shown.</p><button className="button" onClick={reset}>Try again</button><p><Link className="truth-link" href="/demo">Open the separate synthetic lab →</Link></p></main>;
}
