import Link from "next/link";
export default function Loading() {
  return <main id="main-content" className="state-page" aria-busy="true"><h1>Preparing evidence…</h1><p role="status">No price or decision is implied while this loads. Synthetic mode uses only fictional fixtures.</p><p><Link className="truth-link" href="/demo">Explore the synthetic scenario lab while you wait →</Link></p></main>;
}
