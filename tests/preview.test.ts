import assert from "node:assert/strict";
import test from "node:test";
import { z } from "zod";
import { previewMode } from "../src/lib/preview-mode";
import { rwaGet } from "../src/lib/binance/client";
import { loadRwa, platforms, tokens, search, prices, underlyingMarket } from "../src/lib/binance/rwa";
import { observeOndoMultiplier } from "../src/lib/issuer/ondo";
import { loadDashboard } from "../src/lib/evidence/load-dashboard";
import { readFileSync } from "node:fs";

test("mode allows local live only when unset; hosted missing and invalid modes fail closed", () => {
  assert.equal(previewMode({ NODE_ENV: "test" }), "live");
  assert.equal(previewMode({ NODE_ENV: "test", AFTERCLOSE_PREVIEW_MODE: "synthetic", VERCEL: "1" }), "synthetic");
  for (const value of ["", "live", "false", "Synthetic", "typo"]) {
    assert.throws(() => previewMode({ NODE_ENV: "test", AFTERCLOSE_PREVIEW_MODE: value }));
  }
  // Hosted configuration failures render the unavailable live shell, not fixtures.
  assert.equal(previewMode({ NODE_ENV: "test", VERCEL: "1" }), "live");
  assert.equal(previewMode({ NODE_ENV: "test", VERCEL_ENV: "preview" }), "live");
});

test("synthetic and invalid modes block all live entry points before fetch, with or without secrets", async t => {
  const keys = ["AFTERCLOSE_PREVIEW_MODE", "BINANCE_API_KEY", "BINANCE_SECRET_KEY", "VERCEL"];
  const saved = keys.map(k => [k, process.env[k]] as const);
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error("Unexpected outbound request"); };
  t.after(() => { globalThis.fetch = original; for (const [k,v] of saved) { if(v === undefined) delete process.env[k]; else process.env[k] = v; } });
  for (const mode of ["synthetic", "invalid", ""]) for (const secrets of [false, true]) {
    process.env.AFTERCLOSE_PREVIEW_MODE = mode;
    if (secrets) { process.env.BINANCE_API_KEY = "test-only"; process.env.BINANCE_SECRET_KEY = "test-only"; }
    else { delete process.env.BINANCE_API_KEY; delete process.env.BINANCE_SECRET_KEY; }
    for (const invoke of [loadDashboard, loadRwa, observeOndoMultiplier, platforms, tokens, () => search("demo"), () => prices("0x0000000000000000000000000000000000000001"), () => underlyingMarket("0x0000000000000000000000000000000000000001"), () => rwaGet("platforms", {}, z.unknown())]) {
      await assert.rejects(invoke);
    }
  }
  assert.equal(calls, 0);
});

test("refresh stays on guarded server render; synthetic labeling survives loading/error layout", () => {
  const read = (file: string) => readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
  assert.match(read("components/refresh-evidence.tsx"), /router.refresh\(\)/);
  assert.doesNotMatch(read("components/refresh-evidence.tsx"), /fetch\(/);
  assert.match(read("components/refresh-evidence.tsx"), /Refresh synthetic scenario/);
  const home = read("app/page.tsx");
  assert.ok(home.indexOf('previewMode() === "synthetic"') < home.indexOf("await loadDashboard()"));
  assert.match(read("app/layout.tsx"), /SYNTHETIC DEMO — NOT LIVE MARKET DATA/);
  assert.match(read("app/layout.tsx"), /index: false/);
  assert.match(read("app/error.tsx"), /No substitute market data/);
  assert.match(read("app/loading.tsx"), /fictional fixtures/);
  assert.doesNotMatch(read("components/synthetic-dashboard.tsx"), /NVDA|Ondo|Binance|1\.001715/);
});
