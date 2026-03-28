import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyInstall } from "../../src/application/install/apply-install.js";
import { createInstallPlan } from "../../src/application/install/plan-install.js";
import { loadRecursiveLanguageCapabilities } from "../../src/infrastructure/recursive/session-store.js";

const repoRoot = process.cwd();
const fixtureRoot = path.join(repoRoot, "tests", "fixtures", "runtime");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive capabilities flow integration", () => {
  it("writes the canonical recursive structured-analysis capability artifact during install runtime hydration", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-capabilities-"));
    tempRoots.push(tempRoot);
    await fs.copyFile(path.join(fixtureRoot, "contained-install", "package.json"), path.join(tempRoot, "package.json"));

    const plan = createInstallPlan(
      repoRoot,
      {
        targetId: "codex",
        profileId: "core",
        bundleIds: [],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: tempRoot,
        mode: "apply"
      },
      [],
      [],
      {
        id: "codex",
        displayName: "Codex",
        installRootStrategy: "repo-root",
        pathMappings: {
          "AGENTS.md": "AGENTS.md",
          ".agents/skills": ".agents/skills",
          ".specify": ".specify"
        },
        mergeRules: {
          "AGENTS.md": "append-once"
        },
        supportsHooks: false,
        supportsCommands: true,
        supportsAgents: true,
        supportsContexts: true,
        supportsPlugins: false,
        capabilityMatrix: { templates: true },
        sharedRuntimeBridge: {
          instructionSurfaces: ["AGENTS.md", ".agents/skills", ".codex/config.toml"],
          runtimeSurfaces: [
            ".hforge/runtime/index.json",
            ".hforge/runtime/README.md",
            ".hforge/runtime/recursive/language-capabilities.json"
          ],
          supportMode: "native",
          authoritativeSurfaces: [
            ".hforge/library/skills",
            ".hforge/library/rules",
            ".hforge/library/knowledge",
            ".hforge/templates",
            ".hforge/runtime"
          ],
          visibleBridgePaths: ["AGENTS.md", ".agents/skills", ".specify", ".codex"],
          visibilityMode: "hidden-ai-layer"
        }
      },
      { workspaceRoot: tempRoot }
    );

    await applyInstall(tempRoot, plan);

    const capabilities = await loadRecursiveLanguageCapabilities(tempRoot);
    expect(capabilities?.summary).toContain("recursive structured-analysis capability map");
    expect(capabilities?.languages.length).toBeGreaterThan(0);
    expect(await fs.readFile(path.join(tempRoot, ".hforge", "runtime", "recursive", "language-capabilities.json"), "utf8")).toContain(
      "\"languages\""
    );
  });
});
