import "server-only";

/** Only an unset flag on a local process retains the existing live workflow. */
export function previewMode(env: NodeJS.ProcessEnv = process.env): "synthetic" | "live" {
  if (env.AFTERCLOSE_PREVIEW_MODE === "synthetic") return "synthetic";
  if (env.AFTERCLOSE_PREVIEW_MODE === undefined && !env.VERCEL && !env.VERCEL_ENV) return "live";
  throw new Error("AfterClose preview configuration invalid; data access disabled.");
}

export function assertLiveAccess() {
  if (previewMode() !== "live") throw new Error("Live providers disabled in synthetic preview.");
}
