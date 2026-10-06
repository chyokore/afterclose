import "server-only";
import { assertLiveAccess } from "../preview-mode";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { signGet, signedGetPath } from "./auth";

export const endpointNames = ["platforms", "tokens", "search", "price", "underlying-market", "chain-list"] as const;
export type Endpoint = (typeof endpointNames)[number];
export type ResponseAudit = { endpoint: Endpoint; status?: number; latencyMs: number; code?: string; responseTimestamp?: number; networkCode?: string; observedAtMs?: number };
export class ApiError extends Error {
  constructor(public readonly kind: "setup" | "configuration" | "network" | "http" | "schema" | "provider", public readonly status?: number, public readonly audit?: ResponseAudit, public readonly issues?: { path: string; code: string }[]) {
    super(`Binance Web3 request unavailable (${kind})`);
  }
}
export function credentialsConfigured() {
  return Boolean(process.env.BINANCE_API_KEY?.trim() && process.env.BINANCE_SECRET_KEY?.trim());
}

export async function rwaGet<T>(endpoint: Endpoint, params: Record<string, string>, schema: z.ZodType<T>, onResponse?: (audit: ResponseAudit) => void): Promise<T> {
  assertLiveAccess();
  if (!credentialsConfigured()) throw new ApiError("setup");
  // Prevent accidental credential forwarding to alternate hosts or redirects.
  const base = process.env.BINANCE_WEB3_BASE_URL || "https://web3.binance.com/build";
  if (base !== "https://web3.binance.com/build") throw new ApiError("configuration");
  if (!endpointNames.includes(endpoint)) throw new ApiError("configuration");
  const path = signedGetPath(endpoint === "chain-list" ? "/api/v1/dex/aggregator/supported/chain" : `/api/v1/dex/market/rwa/${endpoint}`, params);
  const timestamp = new Date().toISOString();
  const started = performance.now();
  let response: Response;
  try {
    response = await fetch(`https://web3.binance.com${path}`, {
      method: "GET", cache: "no-store", redirect: "error",
      signal: AbortSignal.timeout(12000),
      headers: {
        "X-OC-APIKEY": process.env.BINANCE_API_KEY!,
        "X-OC-TIMESTAMP": timestamp,
        "X-OC-SIGN": signGet(process.env.BINANCE_SECRET_KEY!, timestamp, path),
        "X-OC-NONCE": randomUUID(),
        Accept: "application/json",
      },
    });
  } catch (error) {
    const failure = error as { name?: string; cause?: { code?: string } };
    const allowed = ["ENOTFOUND", "ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "UND_ERR_CONNECT_TIMEOUT", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "SELF_SIGNED_CERT_IN_CHAIN", "CERT_HAS_EXPIRED"];
    const networkCode = failure.name === "TimeoutError" ? "TIMEOUT" : allowed.includes(failure.cause?.code ?? "") ? failure.cause!.code : "UNCLASSIFIED";
    const audit = { endpoint, latencyMs: Math.round(performance.now() - started), networkCode, observedAtMs: Date.now() };
    onResponse?.(audit);
    throw new ApiError("network", undefined, audit);
  }
  let payload: unknown;
  try { payload = await response.json(); } catch (error) {
    // The request timeout can also abort a slow response body after headers arrive.
    const name = (error as { name?: string })?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      const audit = { endpoint, status: response.status, latencyMs: Math.round(performance.now() - started), networkCode: "TIMEOUT", observedAtMs: Date.now() };
      onResponse?.(audit);
      throw new ApiError("network", response.status, audit);
    }
    // Other non-JSON responses are classified below without retaining raw errors.
  }
  const metadata = z.object({ code: z.union([z.string().regex(/^\d{1,10}$/), z.number().int()]).optional(), timestamp: z.number().optional() }).safeParse(payload);
  const audit: ResponseAudit = { endpoint, status: response.status, latencyMs: Math.round(performance.now() - started), observedAtMs: Date.now(), ...(metadata.success ? { code: metadata.data.code === undefined ? undefined : String(metadata.data.code), responseTimestamp: metadata.data.timestamp } : {}) };
  onResponse?.(audit);
  if (!response.ok) {
    // Only known endpoint and HTTP status; no URLs, headers, bodies, or raw errors.
    console.warn("Binance Web3 request failed", { endpoint, status: response.status });
    throw new ApiError("http", response.status, audit);
  }
  const envelope = z.object({ code: z.number(), success: z.boolean(), data: z.unknown().optional() }).safeParse(payload);
  if (!envelope.success) throw new ApiError("schema", response.status, audit);
  if (envelope.data.code !== 0 || !envelope.data.success) throw new ApiError("provider", response.status, audit);
  const parsed = schema.safeParse(envelope.data.data);
  if (!parsed.success) throw new ApiError("schema", response.status, audit, parsed.error.issues.map(i => ({ path: i.path.map(String).join("."), code: i.code })));
  return parsed.data;
}
