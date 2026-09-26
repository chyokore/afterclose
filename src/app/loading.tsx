import Link from "next/link";
export default function Loading() {
  return <main id="main-content" className="state-page" aria-busy="true"><h1>Gathering evidence…</h1><p role="status">Checking provider responses and their timestamps. No price or decision is implied while this loads.</p><p><Link className="truth-link" href="/demo">Explore the synthetic scenario lab while you wait →</Link></p></main>;
}
