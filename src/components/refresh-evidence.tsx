"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
export function RefreshEvidence() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <button type="button" className="refresh-evidence" disabled={pending} onClick={() => startTransition(() => router.refresh())}>{pending ? "Refreshing evidence…" : "Refresh evidence ↻"}</button>;
}
