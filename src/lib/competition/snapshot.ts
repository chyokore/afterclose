import "server-only";
import { mkdir, readFile, rename, writeFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { assertLiveAccess } from "../preview-mode";
import { eligibleSnapshot, verifyReceipt, type EvidenceReceipt } from "./receipt";

// Local-only file, outside public/ and ignored by Git. No public storage provisioned.
export function snapshotStore(directory = resolve(".tools/competition-snapshots")) {
  const path = join(directory, "last-verified.json");
  let pending: Promise<unknown> = Promise.resolve();
  async function read(): Promise<EvidenceReceipt | null> {
    assertLiveAccess();
    try {
      if ((await stat(path)).size > 256_000) return null;
      const parsed = verifyReceipt(JSON.parse(await readFile(path, "utf8")));
      return parsed && eligibleSnapshot(parsed) ? parsed : null;
    } catch { return null; }
  }
  function save(value: EvidenceReceipt): Promise<boolean> {
    assertLiveAccess();
    const operation = pending.then(async () => {
      const checked = verifyReceipt(value);
      if (!checked || !eligibleSnapshot(checked)) return false;
      const previous = await read();
      if (previous && previous.receipt.evaluatedAtMs >= checked.receipt.evaluatedAtMs) return false;
      const json = JSON.stringify(checked);
      if (Buffer.byteLength(json) > 256_000) return false;
      try {
        await mkdir(directory, { recursive: true });
        const temporary = join(directory, `${randomUUID()}.tmp`);
        await writeFile(temporary, json, { mode: 0o600, flag: "wx" });
        await rename(temporary, path);
        return true;
      } catch { return false; }
    });
    pending = operation.catch(() => false);
    return operation;
  }
  return { read, save };
}
export const localSnapshots = snapshotStore();
