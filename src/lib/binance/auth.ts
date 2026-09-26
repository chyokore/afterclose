import { createHmac } from "node:crypto";

// Pure helper: never reads credentials from the environment.
export function signedGetPath(endpoint: string, params: Record<string, string> = {}) {
  if (!/^\/api\/v1\/dex\/market\/rwa\/[a-z-]+$/.test(endpoint)) {
    throw new Error("Invalid RWA endpoint");
  }
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  return `/build${endpoint}${query ? `?${query}` : ""}`;
}

export function signGet(secret: string, timestamp: string, requestPath: string) {
  if (!requestPath.startsWith("/build/api/")) throw new Error("Missing /build prefix");
  return createHmac("sha256", secret)
    .update(timestamp + "GET" + requestPath, "utf8")
    .digest("base64");
}
