import "server-only";
import { deploymentConfiguration, productionRuntime } from "./deployment";

/** Only an unset flag on a local process retains the existing live workflow. */
export function previewMode(env: NodeJS.ProcessEnv = process.env): "synthetic" | "live" {
  const config = deploymentConfiguration(env);
  if (config.mode === "unavailable" && (productionRuntime(env) || env.AFTERCLOSE_DEPLOYMENT_MODE !== undefined)) return "live";
  if (config.mode === "synthetic") return "synthetic";
  if (env.AFTERCLOSE_DEPLOYMENT_MODE === "competition-live" && env.AFTERCLOSE_PREVIEW_MODE === undefined) return "live";
  if (env.AFTERCLOSE_PREVIEW_MODE === "synthetic") return "synthetic";
  if (env.AFTERCLOSE_PREVIEW_MODE === undefined && !env.VERCEL && !env.VERCEL_ENV) return "live";
  throw new Error("AfterClose preview configuration invalid; data access disabled.");
}

export function assertLiveAccess() {
  if (!deploymentConfiguration().liveAllowed) throw new Error("Live evidence access disabled by deployment configuration.");
  if (previewMode() !== "live") throw new Error("Live providers disabled in synthetic preview.");
}
