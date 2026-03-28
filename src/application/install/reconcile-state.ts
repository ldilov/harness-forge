import path from "node:path";

import { exists, readJsonFile, RUNTIME_DIR, RUNTIME_INDEX_FILE, RUNTIME_SCHEMA_VERSION } from "../../shared/index.js";
import { loadInstallState } from "../../domain/state/install-state.js";

export async function reconcileState(root: string): Promise<{
  status: "clean" | "drifted" | "missing";
  missing: string[];
  runtimeSchemaVersion?: number;
}> {
  const state = await loadInstallState(root);
  if (!state) {
    return { status: "missing", missing: [] };
  }

  const missing: string[] = [];
  for (const file of state.fileWrites) {
    if (!(await exists(file))) {
      missing.push(file);
    }
  }

  const runtimeIndexPath = path.join(root, RUNTIME_DIR, RUNTIME_INDEX_FILE);
  if (await exists(runtimeIndexPath)) {
    const runtimeIndex = await readJsonFile<{ targets?: Array<{ targetId: string }>; runtimeSchemaVersion?: number }>(runtimeIndexPath);
    const runtimeTargets = new Set((runtimeIndex.targets ?? []).map((target) => target.targetId));
    for (const targetId of state.installedTargets) {
      if (!runtimeTargets.has(targetId)) {
        missing.push(`${runtimeIndexPath}#targets/${targetId}`);
      }
    }
    if (runtimeIndex.runtimeSchemaVersion && runtimeIndex.runtimeSchemaVersion < RUNTIME_SCHEMA_VERSION) {
      missing.push(`${runtimeIndexPath}#runtimeSchemaVersion`);
    }
  }

  missing.sort((left, right) => {
    const leftRuntime = left.includes(RUNTIME_DIR) ? 0 : 1;
    const rightRuntime = right.includes(RUNTIME_DIR) ? 0 : 1;
    return leftRuntime - rightRuntime;
  });

  return {
    status: missing.length > 0 ? "drifted" : "clean",
    missing,
    runtimeSchemaVersion: state.runtimeSchemaVersion
  };
}
