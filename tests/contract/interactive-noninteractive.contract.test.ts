import path from "node:path";

import { describe, expect, it } from "vitest";

import { applySetupIntent } from "../../src/cli/interactive/review-plan.js";
import { normalizeFolderSelection } from "../../src/cli/interactive/setup-intent.js";

describe("interactive non-interactive contract", () => {
  it("supports prompt-free preview mode for direct execution", async () => {
    const workspaceRoot = path.join(process.cwd(), "tests", "fixtures", "interactive-cli", "clean-repo");
    const result = await applySetupIntent({
      workspaceRoot,
      folderSelection: normalizeFolderSelection(workspaceRoot, "current-directory", "."),
      targetIds: ["codex"],
      setupProfile: "recommended",
      enabledModules: ["working-memory", "task-pack-support"],
      recommendedTargetIds: ["codex"],
      dryRun: true,
      applyChanges: false,
      source: "direct"
    });

    expect(result.status).toBe("preview");
    expect(result.operatorMessage).toContain("Preview only");
    expect(result.nextSuggestedCommands[0]).toContain("hforge init");
  });
});
