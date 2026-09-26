import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { ApiError, rwaGet } from "../src/lib/binance/client";
import { signGet } from "../src/lib/binance/auth";

test("client safeguards (synthetic responses, not live API evidence)", async t => {
  const originalFetch = globalThis.fetch;
  const original = { key: process.env.BINANCE_API_KEY, secret: process.env.BINANCE_SECRET_KEY, base: process.env.BINANCE_WEB3_BASE_URL };
  t.after(() => {
    globalThis.fetch = originalFetch;
    for (const [name, value] of Object.entries({ BINANCE_API_KEY: original.key, BINANCE_SECRET_KEY: original.secret, BINANCE_WEB3_BASE_URL: original.base })) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  });
  delete process.env.BINANCE_API_KEY;
  delete process.env.BINANCE_SECRET_KEY;
  globalThis.fetch = async () => { throw new Error("Fetch must not run"); };
  await assert.rejects(rwaGet("platforms", {}, z.array(z.unknown())), (e: ApiError) => e.kind === "setup");
  process.env.BINANCE_API_KEY = "test-key";
  process.env.BINANCE_SECRET_KEY = "test-secret";
  process.env.BINANCE_WEB3_BASE_URL = "https://example.com/build";
  await assert.rejects(rwaGet("platforms", {}, z.array(z.unknown())), (e: ApiError) => e.kind === "configuration");
  process.env.BINANCE_WEB3_BASE_URL = "https://web3.binance.com/build";
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("X-OC-SIGN"), signGet("test-secret", headers.get("X-OC-TIMESTAMP")!, url.pathname + url.search));
    assert.equal(init?.redirect, "error");
    assert.equal(init?.cache, "no-store");
    return Response.json({ code: 0, success: true, data: [] });
  };
  assert.deepEqual(await rwaGet("search", { keyword: "two words" }, z.array(z.unknown())), []);
  globalThis.fetch = async () => Response.json({ code: 40102, success: false, msg: "sensitive provider content" });
  await assert.rejects(rwaGet("platforms", {}, z.array(z.unknown())), (e: ApiError) => e.kind === "provider" && !e.message.includes("sensitive"));
  globalThis.fetch = async () => Response.json({ code: 0, success: true, data: "wrong shape" });
  await assert.rejects(rwaGet("platforms", {}, z.array(z.unknown())), (e: ApiError) => e.kind === "schema");
  globalThis.fetch = async () => { throw new Error("private error"); };
  await assert.rejects(rwaGet("platforms", {}, z.array(z.unknown())), (e: ApiError) => e.kind === "network" && !e.message.includes("private"));
});
