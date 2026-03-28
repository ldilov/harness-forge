import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyInstall } from "../../src/application/install/apply-install.js";
import { createInstallPlan } from "../../src/application/install/plan-install.js";

const repoRoot = process.cwd();
const fixtureRoot = path.join(repoRoot, "tests", "fixtures", "runtime");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive promotion install integration", () => {
  it("installs recursive structured-analysis discovery surfaces and generated runtime metadata together", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-promotion-"));
    tempRoots.push(tempRoot);
    await fs.copyFile(path.join(fixtureRoot, "contained-install", "package.json"), path.join(tempRoot, "package.json"));

    const plan = createInstallPlan(
      repoRoot,
      {
        targetId: "codex",
        profileId: "core",
        bundleIds: ["baseline:agents"],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: tempRoot,
        mode: "apply"
      },
      [
        {
          id: "baseline:agents",
          family: "baseline",
          version: 1,
          description: "",
          paths: ["AGENTS.md", ".agents/skills/recursive-structured-analysis", "skills/recursive-structured-analysis"],
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

    const [manifest, catalog, runtimeIndex, wrapperSkill] = await Promise.all([
      fs.readFile(path.join(tempRoot, ".hforge", "agent-manifest.json"), "utf8"),
      fs.readFile(path.join(tempRoot, ".hforge", "generated", "agent-command-catalog.json"), "utf8"),
      fs.readFile(path.join(tempRoot, ".hforge", "runtime", "index.json"), "utf8"),
      fs.readFile(path.join(tempRoot, ".agents", "skills", "recursive-structured-analysis", "SKILL.md"), "utf8")
    ]);

    expect(manifest).toContain(".hforge/runtime/recursive/language-capabilities.json");
    expect(manifest).toContain("recursive inspect-run");
    expect(catalog).toContain("recursive capabilities");
    expect(catalog).toContain("recursive run <sessionId> --file");
    expect(runtimeIndex).toContain("recursive-language-capabilities");
    expect(wrapperSkill).toContain(".hforge/library/skills/recursive-structured-analysis/SKILL.md");
    await expect(fs.access(path.join(tempRoot, ".hforge", "runtime", "recursive", "language-capabilities.json"))).resolves.toBeUndefined();
  });
});
