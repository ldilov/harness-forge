import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildReviewPlan } from "../../src/cli/interactive/review-plan.js";
import { normalizeFolderSelection } from "../../src/cli/interactive/setup-intent.js";

describe("onboarding selection contract", () => {
  it("builds a review plan that shows folder, target, profile, modules, and planned writes", async () => {
    const workspaceRoot = path.join(process.cwd(), "tests", "fixtures", "interactive-cli", "clean-repo");
    const reviewPlan = await buildReviewPlan({
      workspaceRoot,
      folderSelection: normalizeFolderSelection(workspaceRoot, "current-directory", "."),
      targetIds: ["codex"],
      setupProfile: "recommended",
      enabledModules: ["working-memory", "task-pack-support", "export-support"],
      recommendedTargetIds: ["codex"],
      dryRun: true,
      applyChanges: false,
      source: "direct"
    });

    expect(reviewPlan.workspaceRoot).toBe(workspaceRoot);
    expect(reviewPlan.targetIds).toEqual(["codex"]);
    expect(reviewPlan.setupProfile).toBe("recommended");
    expect(reviewPlan.enabledModules).toContain("Working memory");
    expect(reviewPlan.plannedWrites.some((item) => item.path.endsWith(path.join(".hforge", "runtime", "index.json")))).toBe(true);
    expect(reviewPlan.directCommandPreview).toContain("--agent codex");
  });
});
