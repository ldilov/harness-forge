import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";

export async function createPrunePlan(workspaceRoot: string, apply = false): Promise<{
  removed: string[];
  remaining: string[];
}> {
  const state = await loadInstallState(workspaceRoot);
  if (!state) {
    return { removed: [], remaining: [] };
  }

  const seen = new Set<string>();
  const removed: string[] = [];
  const remaining: string[] = [];

  for (const filePath of state.fileWrites) {
    if (seen.has(filePath)) {
      removed.push(filePath);
      continue;
    }
    seen.add(filePath);
    remaining.push(filePath);
  }

  if (apply && removed.length > 0) {
    await saveInstallState(workspaceRoot, {
      ...state,
      fileWrites: remaining,
      timestamps: {
        ...state.timestamps,
        updatedAt: new Date().toISOString()
      }
    });
  }

  return { removed, remaining };
}
