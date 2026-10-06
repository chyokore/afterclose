import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import test from "node:test";
import { signedGetPath, signGet } from "../src/lib/binance/auth";

test("GET signing matches an independent WebCrypto implementation", async () => {
  const secret = "unit-test-only-not-a-credential";
  const timestamp = "2026-09-26T12:00:00.000Z";
  const path = signedGetPath("/api/v1/dex/market/rwa/search", { keyword: "A B/+", platformId: "ondo" });
  assert.equal(path, "/build/api/v1/dex/market/rwa/search?keyword=A%20B%2F%2B&platformId=ondo");
  const encoder = new TextEncoder();
  const key = await webcrypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await webcrypto.subtle.sign("HMAC", key, encoder.encode(timestamp + "GET" + path));
  assert.equal(signGet(secret, timestamp, path), Buffer.from(bytes).toString("base64"));
  assert.notEqual(signGet(secret, timestamp, path), signGet(secret, timestamp, path.replace("%20", "+")));
});
test("unsigned base prefix and arbitrary endpoints are rejected", () => {
  assert.throws(() => signGet("test", "test", "/api/v1/dex/market/rwa/platforms"));
  assert.throws(() => signedGetPath("https://example.com"));
  assert.throws(() => signedGetPath("/api/v1/dex/market/rwa/../swap"));
  assert.equal(signedGetPath("/api/v1/dex/market/rwa/platforms"), "/build/api/v1/dex/market/rwa/platforms");
  assert.equal(signedGetPath("/api/v1/dex/aggregator/supported/chain"), "/build/api/v1/dex/aggregator/supported/chain");
  assert.throws(() => signedGetPath("/api/v1/dex/aggregator/quote"));
  assert.throws(() => signedGetPath("/api/v1/dex/pre-transaction/simulate"));
});
