import { describe, expect, it } from "vitest";

import { createInstallPlan } from "../../src/application/install/plan-install.js";

describe("target-ready install integration", () => {
  it("creates a plan for a selected target", () => {
    const plan = createInstallPlan(
      "/repo",
      {
        targetId: "codex",
        profileId: "core",
        bundleIds: ["baseline:agents"],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: "/repo",
        mode: "dry-run"
      },
      [
        {
          id: "baseline:agents",
          family: "baseline",
          version: 1,
          description: "",
          paths: ["AGENTS.md"],
          targets: ["codex"],
          dependencies: [],
          conflicts: [],
          optional: false,
          defaultInstall: true,
          stability: "stable",
          tags: [],
          owner: "core"
        }
      ],
      [
        {
          id: "core",
          description: "",
          bundleIds: ["baseline:agents"],
          recommendedTargets: [],
          recommendedLanguages: [],
          recommendedCapabilities: []
        }
      ],
      {
        id: "codex",
        displayName: "Codex",
        installRootStrategy: "repo-root",
        pathMappings: { "AGENTS.md": "AGENTS.md" },
        mergeRules: {},
        supportsHooks: false,
        supportsCommands: true,
        supportsAgents: true,
        supportsContexts: true,
        supportsPlugins: false,
        capabilityMatrix: { templates: true }
      }
    );

    expect(plan.selection.targetId).toBe("codex");
    expect(plan.operations.length).toBeGreaterThan(0);
  });
});
