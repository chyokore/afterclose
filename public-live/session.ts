import type { GatewayResponse } from '../gateway/contract';
export const GATEWAY_URL = 'https://wakuqrnxjwikvlrxgezg.supabase.co/functions/v1/live-evidence?forceFunctionRegion=eu-central-1';
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`).join(',')}}`;
  throw Error('Invalid receipt');
}
export async function verifyDigest(body: GatewayResponse) {
  const r = body?.receipt;
  if (body?.schemaVersion !== 'afterclose-live-gateway/v1' || body.status !== 'LIVE_EVIDENCE' || r?.mode !== 'live' || !Array.isArray(r.fields) || !Array.isArray(r.engine?.result?.findings) || !['WAIT','MONITOR','PROCEED_TO_REVIEW'].includes(r.engine.result.decision) || !Number.isSafeInteger(r.evaluatedAtMs) || !/^[a-f0-9]{64}$/.test(body.receiptDigest)) throw Error('Invalid evidence');
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonicalJson(r))))).map(x => x.toString(16).padStart(2,'0')).join('');
  if (digest !== body.receiptDigest) throw Error('Receipt digest mismatch');
  return body;
}
export function createLiveSession(storage: Pick<Storage,'getItem'|'setItem'>, request: typeof fetch = fetch, clock = Date.now, url = GATEWAY_URL) {
  const key = 'afterclose-live-cooldown-v1';
  let inflight: Promise<GatewayResponse> | null = null, memoryUntil = 0;
  const until = () => { try { return Math.max(memoryUntil, Number(storage.getItem(key)) || 0); } catch { return memoryUntil; } };
  const block = (duration: number) => { memoryUntil = Math.max(until(), clock() + duration); try { storage.setItem(key, String(memoryUntil)); } catch { /* Memory protection still applies if storage is unavailable. */ } };
  return {
    remainingMs: () => Math.max(0, until() - clock()),
    loading: () => inflight !== null,
    refresh: () => {
      if (inflight) return inflight;
      if (clock() < until()) return Promise.reject(Error('Refresh cooldown active'));
      block(45_000); // Survives page navigation while a request may still be running.
      inflight = (async () => {
        try {
          const response = await request(url, { mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(30000) });
          const retry = response.headers.get('Retry-After');
          if (retry) { const duration = /^\d+$/.test(retry.trim()) ? Number(retry) * 1000 : Date.parse(retry) - clock(); if (Number.isFinite(duration) && duration > 0) block(duration); }
          if (!response.ok) throw Error('Gateway unavailable');
          const text = await response.text(); if (text.length > 128000) throw Error('Response too large');
          return await verifyDigest(JSON.parse(text));
        } catch { block(60_000); throw Error('LIVE EVIDENCE TEMPORARILY UNAVAILABLE'); }
        finally { inflight = null; }
      })();
      return inflight;
    },
  };
}
