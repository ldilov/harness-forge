import { describe, expect, it } from "vitest";

import { createInstallPlan } from "../../src/application/install/plan-install.js";
import { recommendBundles } from "../../src/application/recommendations/recommend-bundles.js";

describe("knowledge pack recommendation integration", () => {
  it("exports a recommendation function", async () => {
    await expect(recommendBundles(process.cwd())).resolves.toBeDefined();
  });

  it("plans seeded knowledge directories when a seeded language is selected", () => {
    const plan = createInstallPlan(
      process.cwd(),
      {
        targetId: "codex",
        profileId: undefined,
        bundleIds: [],
        languageIds: ["typescript"],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: process.cwd(),
        mode: "dry-run"
      },
      [
        {
          id: "lang:typescript",
          family: "language",
          version: 1,
          description: "TypeScript seeded pack",
          paths: ["knowledge-bases/seeded/typescript", "rules/typescript/README.md"],
          targets: ["codex"],
          dependencies: [],
          conflicts: [],
          optional: true,
          defaultInstall: false,
          stability: "stable",
          tags: ["typescript", "seeded"],
          owner: "core"
        }
      ],
      [],
      {
        id: "codex",
        displayName: "Codex",
        installRootStrategy: "repo-root",
        pathMappings: {},
        mergeRules: {},
        supportsHooks: false,
        supportsCommands: true,
        supportsAgents: true,
        supportsContexts: true,
        supportsPlugins: false,
        capabilityMatrix: { templates: true }
      }
    );

    expect(plan.operations.some((operation) => operation.sourcePath.endsWith("knowledge-bases\\seeded\\typescript") || operation.sourcePath.endsWith("knowledge-bases/seeded/typescript"))).toBe(true);
  });
});
