"use client";
import { useEffect, useState } from "react";
import { snapshotMessage } from "@/lib/evidence/status";

export function SnapshotNotice({ snapshotMs, maxAgeMs }: { snapshotMs: number; maxAgeMs: number }) {
  const [nowMs, setNowMs] = useState(snapshotMs);
  useEffect(() => {
    const update = () => setNowMs(Date.now());
    const timer = setInterval(update, 1000);
    window.addEventListener("focus", update);
    return () => { clearInterval(timer); window.removeEventListener("focus", update); };
  }, [snapshotMs]);
  return <p className="snapshot-freshness" role="status">{snapshotMessage(snapshotMs, nowMs, maxAgeMs)}</p>;
}
