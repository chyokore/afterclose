"use client";
import { useState } from "react";
export function EvidenceReceiptPanel({ canonicalJson, digest, historical = false }: { canonicalJson: string; digest: string; historical?: boolean }) {
  const [copyStatus, setCopyStatus] = useState("");
  return <details className="receipt-inspector"><summary>{historical ? "Inspect historical receipt" : "Evidence Receipt — inspect / copy JSON"}</summary>
    <p>SHA-256 of canonical JSON (UTF-8). Object keys sort lexicographically; arrays preserve order. This proves content integrity and reproducibility, not provider authorship or market accuracy.</p>
    <code className="receipt-digest">{digest}</code>
    <button className="button" type="button" onClick={async () => { try { await navigator.clipboard.writeText(canonicalJson); setCopyStatus("Receipt JSON copied."); } catch { setCopyStatus("Clipboard unavailable. Select the JSON below and copy it manually."); } }}>Copy receipt JSON</button>
    <p role="status" aria-live="polite">{copyStatus}</p>
    <label>Canonical receipt JSON<textarea readOnly rows={12} value={canonicalJson} spellCheck={false} onFocus={e => e.currentTarget.select()} /></label>
  </details>;
}
