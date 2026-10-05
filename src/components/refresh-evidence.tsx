"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
export function RefreshEvidence({ synthetic = false }: { synthetic?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className="refresh-evidence" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{synthetic ? pending ? "Reloading synthetic scenario…" : "Refresh synthetic scenario ↻" : pending ? "Refreshing evidence…" : "Refresh evidence ↻"}</button>;
}
