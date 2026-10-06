import "server-only";

export function productionRuntime(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV === "production" || Boolean(env.RENDER || env.VERCEL || env.VERCEL_ENV);
}
export function deploymentConfiguration(env: NodeJS.ProcessEnv = process.env) {
  const mode = env.AFTERCLOSE_DEPLOYMENT_MODE;
  const preview = env.AFTERCLOSE_PREVIEW_MODE;
  if (mode !== undefined && !["competition-live", "synthetic"].includes(mode)) return { mode: "unavailable", liveAllowed: false, reason: "INVALID_DEPLOYMENT_MODE" } as const;
  if (preview !== undefined && preview !== "synthetic") return { mode: "unavailable", liveAllowed: false, reason: "INVALID_PREVIEW_MODE" } as const;
  if (mode === "competition-live" && preview !== undefined) return { mode: "unavailable", liveAllowed: false, reason: "CONFLICTING_MODES" } as const;
  if (mode === "synthetic" || preview === "synthetic") return { mode: "synthetic", liveAllowed: false, reason: "SYNTHETIC_ONLY" } as const;
  if (mode === "competition-live") return { mode: "competition-live", liveAllowed: true, reason: null } as const;
  if (productionRuntime(env)) return { mode: "unavailable", liveAllowed: false, reason: "DEPLOYMENT_MODE_REQUIRED" } as const;
  return { mode: "local", liveAllowed: true, reason: null } as const;
}

// Syntactic safety only, not proof of authentication or permission. No values escape.
export function validCredential(value: string | undefined) {
  return typeof value === "string" && /^[A-Za-z0-9+/_=.-]{8,512}$/.test(value);
}
