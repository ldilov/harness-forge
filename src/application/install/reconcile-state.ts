import { exists } from "../../shared/index.js";
import { loadInstallState } from "../../domain/state/install-state.js";

export async function reconcileState(root: string): Promise<{ status: "clean" | "drifted" | "missing"; missing: string[] }> {
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

  return {
    status: missing.length > 0 ? "drifted" : "clean",
    missing
  };
}
