import path from "node:path";

import { AI_LAYER_ROOT_DIR, exists } from "../../shared/index.js";

export type WorkspacePhase = "setup" | "operate" | "maintain";

export async function detectWorkspacePhase(workspaceRoot: string): Promise<WorkspacePhase> {
  const hforgeExists = await exists(path.join(workspaceRoot, AI_LAYER_ROOT_DIR));
  if (!hforgeExists) {
    return "setup";
  }
  // Could check doctor status here for "maintain" but keep it simple for now
  return "operate";
}

export function suggestCommandsForPhase(phase: WorkspacePhase): string[] {
  switch (phase) {
    case "setup":
      return [
        "hforge init --root . --json",
        "hforge bootstrap --root . --yes",
        "hforge shell setup --yes",
      ];
    case "operate":
      return [
        "hforge recommend . --json",
        "hforge review --root . --json",
        "hforge task list --root . --json",
      ];
    case "maintain":
      return [
        "hforge doctor --root . --json",
        "hforge refresh --root . --json",
        "hforge update --root . --yes",
      ];
  }
}
