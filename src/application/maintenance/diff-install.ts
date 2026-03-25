import { loadInstallState } from "../../domain/state/install-state.js";
import { exists } from "../../shared/index.js";

export async function createDiffInstallReport(workspaceRoot: string): Promise<{
  installed: string[];
  present: string[];
  missing: string[];
}> {
  const state = await loadInstallState(workspaceRoot);
  const installed = state?.fileWrites ?? [];
  const present: string[] = [];
  const missing: string[] = [];

  for (const filePath of installed) {
    if (await exists(filePath)) {
      present.push(filePath);
    } else {
      missing.push(filePath);
    }
  }

  return { installed, present, missing };
}
