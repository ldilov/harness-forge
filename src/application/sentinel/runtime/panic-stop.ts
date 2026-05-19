import path from "node:path";
import fs from "node:fs/promises";
import { stringify as yamlStringify } from "yaml";
import { ensureDir, exists } from "../../../shared/fs.js";
import { sentinelCadencePath } from "../../../domain/sentinel/paths.js";
import { loadCadence } from "../budget/budget-ledger.js";
import type { CadenceConfig } from "../budget/budget-ledger.js";

export interface PanicStopWriteResult {
  readonly previous: boolean;
  readonly current: boolean;
  readonly path: string;
}

export async function writePanicStop(
  workspaceRoot: string,
  panicStop: boolean,
): Promise<PanicStopWriteResult> {
  const filePath = sentinelCadencePath(workspaceRoot);
  await ensureDir(path.dirname(filePath));
  const current: CadenceConfig = (await exists(filePath))
    ? await loadCadence(workspaceRoot)
    : await loadCadence(workspaceRoot);
  const previous = current.panicStop;
  const next: CadenceConfig = { ...current, panicStop };
  const yaml = yamlStringify(next);
  const tmp = `${filePath}.tmp`;
  await fs.writeFile(tmp, yaml, "utf8");
  await fs.rename(tmp, filePath);
  return { previous, current: panicStop, path: filePath };
}

export async function readPanicStop(workspaceRoot: string): Promise<boolean> {
  const cadence = await loadCadence(workspaceRoot);
  return cadence.panicStop;
}
