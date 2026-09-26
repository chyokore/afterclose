import "server-only";
import { ONDO_ASSET_SOURCE, parseOndoPage, unavailableIssuer } from "./multiplier";

export async function observeOndoMultiplier() {
  try {
    const response = await fetch(ONDO_ASSET_SOURCE, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(8000), headers: { Accept: "text/html" } });
    if (!response.ok) return unavailableIssuer(Date.now(), `Official issuer page returned HTTP ${response.status}; no multiplier substituted.`);
    if (!response.headers.get("content-type")?.includes("text/html") || !response.body) return unavailableIssuer(Date.now());
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let html = "", bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 2_000_000) { await reader.cancel(); return unavailableIssuer(Date.now()); }
        html += decoder.decode(value, { stream: true });
      }
      html += decoder.decode();
    } finally { reader.releaseLock(); }
    return parseOndoPage(html, Date.now());
  } catch { return unavailableIssuer(Date.now()); }
}
