import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { buildProvenanceIndex } from "../../src/application/install/build-provenance-index.js";
import { planWorkspaceUpdate } from "../../src/application/install/plan-workspace-update.js";
import { parseProvenanceIndexDocument } from "../../src/domain/runtime/provenance.js";
import { parseUpdateActionPlanDocument } from "../../src/domain/runtime/update-action-plan.js";

const tempRoots: string[] = [];

afterEach(() => {
  tempRoots.splice(0).length = 0;
});

describe("provenance index contract", () => {
  it("classifies canonical, bridge, and runtime surfaces for install-time truth", () => {
    const workspaceRoot = path.join(os.tmpdir(), `hforge-provenance-${Date.now()}`);
    tempRoots.push(workspaceRoot);
    const plan = {
      selection: {
        targetId: "codex",
        bundleIds: ["baseline:agents"],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: workspaceRoot,
        mode: "apply" as const
      },
      operations: [
        {
          type: "copy" as const,
          bundleId: "baseline:agents",
          sourcePath: "skills/typescript-engineering",
          destinationPath: path.join(workspaceRoot, ".hforge", "library", "skills", "typescript-engineering"),
          mergeStrategy: "copy",
          reason: "baseline:agents",
          riskLevel: "low" as const,
          backupRequired: true
        },
        {
          type: "copy" as const,
          bundleId: "baseline:agents",
          sourcePath: "AGENTS.md",
          destinationPath: path.join(workspaceRoot, "AGENTS.md"),
          mergeStrategy: "append-once",
          reason: "baseline:agents",
          riskLevel: "low" as const,
          backupRequired: true
        },
        {
          type: "merge" as const,
          bundleId: "baseline:agents",
          sourcePath: "runtime/index.json",
          destinationPath: path.join(workspaceRoot, ".hforge", "runtime", "index.json"),
          mergeStrategy: "merge-json",
          reason: "baseline:agents",
          riskLevel: "low" as const,
          backupRequired: false
        }
      ]
    };

    const provenance = parseProvenanceIndexDocument(buildProvenanceIndex(workspaceRoot, plan));
    const updatePlan = parseUpdateActionPlanDocument(planWorkspaceUpdate(workspaceRoot, plan));

    expect(provenance.records.find((record) => record.path === ".hforge/library/skills/typescript-engineering")?.ownershipClass).toBe(
      "managed-canonical"
    );
    expect(provenance.records.find((record) => record.path === "AGENTS.md")?.editPolicy).toBe(
      "preserve-user-modifications"
    );
    expect(provenance.records.find((record) => record.path === ".hforge/runtime/index.json")?.ownershipClass).toBe(
      "generated-runtime"
    );

    expect(updatePlan.items.find((item) => item.path === "AGENTS.md")?.proposedAction).toBe("preserve");
    expect(updatePlan.items.find((item) => item.path === ".hforge/runtime/index.json")?.proposedAction).toBe("merge");
  });
});
