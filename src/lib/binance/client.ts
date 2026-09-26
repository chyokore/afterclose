import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { signGet, signedGetPath } from "./auth";

export const endpointNames = ["platforms", "tokens", "search", "price", "underlying-market"] as const;
export type Endpoint = (typeof endpointNames)[number];
export class ApiError extends Error {
  constructor(public readonly kind: "setup" | "configuration" | "network" | "http" | "schema" | "provider", public readonly status?: number) {
    super(`Binance Web3 request unavailable (${kind})`);
  }
}
export function credentialsConfigured() {
  return Boolean(process.env.BINANCE_API_KEY?.trim() && process.env.BINANCE_SECRET_KEY?.trim());
}

export async function rwaGet<T>(endpoint: Endpoint, params: Record<string, string>, schema: z.ZodType<T>): Promise<T> {
  if (!credentialsConfigured()) throw new ApiError("setup");
  // Prevent accidental credential forwarding to alternate hosts or redirects.
  const base = process.env.BINANCE_WEB3_BASE_URL || "https://web3.binance.com/build";
  if (base !== "https://web3.binance.com/build") throw new ApiError("configuration");
  if (!endpointNames.includes(endpoint)) throw new ApiError("configuration");
  const path = signedGetPath(`/api/v1/dex/market/rwa/${endpoint}`, params);
  const timestamp = new Date().toISOString();
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
  } catch {
    throw new ApiError("network");
  }
  if (!response.ok) {
    // Only known endpoint and HTTP status; no URLs, headers, bodies, or raw errors.
    console.warn("Binance Web3 request failed", { endpoint, status: response.status });
    throw new ApiError("http", response.status);
  }
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new ApiError("schema"); }
  const envelope = z.object({ code: z.number(), success: z.boolean(), data: z.unknown().optional() }).safeParse(payload);
  if (!envelope.success) throw new ApiError("schema");
  if (envelope.data.code !== 0 || !envelope.data.success) throw new ApiError("provider");
  const parsed = schema.safeParse(envelope.data.data);
  if (!parsed.success) throw new ApiError("schema");
  return parsed.data;
}
