import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyInstall } from "../../src/application/install/apply-install.js";
import { createInstallPlan } from "../../src/application/install/plan-install.js";
import { loadInstallState } from "../../src/domain/state/install-state.js";

const repoRoot = process.cwd();
const fixtureRoot = path.join(repoRoot, "tests", "fixtures", "runtime");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("aio v2 install layout integration", () => {
  it("keeps canonical ai content hidden under .hforge while leaving thin bridges visible", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-hidden-layout-"));
    tempRoots.push(tempRoot);
    await fs.copyFile(
      path.join(fixtureRoot, "contained-install", "package.json"),
      path.join(tempRoot, "package.json")
    );

    const plan = createInstallPlan(
      repoRoot,
      {
        targetId: "codex",
        profileId: "core",
        bundleIds: ["baseline:agents"],
        languageIds: ["typescript"],
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
          paths: ["AGENTS.md", ".agents/skills/typescript-engineering", "skills/typescript-engineering", "agents/planner.md"],
          targets: ["codex"],
          dependencies: [],
          conflicts: [],
          optional: false,
          defaultInstall: true,
          stability: "stable",
          tags: [],
          owner: "core"
        },
        {
          id: "lang:typescript",
          family: "language",
          version: 1,
          description: "",
          paths: [
            "knowledge-bases/seeded/typescript",
            "rules/common",
            "rules/typescript",
            "templates/workflows/implement-typescript-change.md"
          ],
          targets: ["codex"],
          dependencies: [],
          conflicts: [],
          optional: true,
          defaultInstall: false,
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
          runtimeSurfaces: [".hforge/runtime/index.json", ".hforge/runtime/README.md"],
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

    await expect(fs.access(path.join(tempRoot, "AGENTS.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(tempRoot, ".agents", "skills", "typescript-engineering", "SKILL.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(tempRoot, ".hforge", "library", "skills", "typescript-engineering", "SKILL.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(tempRoot, ".hforge", "library", "rules", "common", "README.md"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(tempRoot, ".hforge", "library", "knowledge", "seeded", "typescript"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(tempRoot, ".hforge", "templates", "workflows", "implement-typescript-change.md"))).resolves.toBeUndefined();

    await expect(fs.access(path.join(tempRoot, "skills"))).rejects.toThrow();
    await expect(fs.access(path.join(tempRoot, "rules"))).rejects.toThrow();
    await expect(fs.access(path.join(tempRoot, "knowledge-bases"))).rejects.toThrow();

    const [agentsBridge, canonicalSkill, runtimeIndex, installState] = await Promise.all([
      fs.readFile(path.join(tempRoot, ".agents", "skills", "typescript-engineering", "SKILL.md"), "utf8"),
      fs.readFile(path.join(tempRoot, ".hforge", "library", "skills", "typescript-engineering", "SKILL.md"), "utf8"),
      fs.readFile(path.join(tempRoot, ".hforge", "runtime", "index.json"), "utf8"),
      loadInstallState(tempRoot)
    ]);
    const parsedRuntimeIndex = JSON.parse(runtimeIndex) as {
      authoritativeSurfaces?: string[];
      visibleBridgePaths?: string[];
    };

    expect(agentsBridge).toContain(".hforge/library/skills/typescript-engineering/SKILL.md");
    expect(canonicalSkill).toContain(".hforge/library/rules/common/README.md");
    expect(parsedRuntimeIndex.authoritativeSurfaces).toContain(".hforge/library/skills");
    expect(parsedRuntimeIndex.visibleBridgePaths).toContain("AGENTS.md");
    expect(installState?.visibilityMode).toBe("hidden-ai-layer");
    expect(installState?.hiddenCanonicalRoots).toContain(path.join(tempRoot, ".hforge", "library", "skills"));
  });

  it("keeps both AGENTS.md and CLAUDE.md visible for claude installs", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-claude-layout-"));
    tempRoots.push(tempRoot);
    await fs.copyFile(
      path.join(fixtureRoot, "contained-install", "package.json"),
      path.join(tempRoot, "package.json")
    );

    const plan = createInstallPlan(
      repoRoot,
      {
        targetId: "claude-code",
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
          paths: ["AGENTS.md"],
          targets: ["claude-code"],
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
        id: "claude-code",
        displayName: "Claude Code",
        installRootStrategy: "repo-root",
        pathMappings: {
          "AGENTS.md": "CLAUDE.md",
          ".agents/skills": ".agents/skills",
          ".specify": ".specify"
        },
        mergeRules: {
          "AGENTS.md": "copy"
        },
        supportsHooks: true,
        supportsCommands: true,
        supportsAgents: true,
        supportsContexts: true,
        supportsPlugins: true,
        capabilityMatrix: { templates: true },
        sharedRuntimeBridge: {
          instructionSurfaces: ["AGENTS.md", "CLAUDE.md", ".agents/skills", ".claude/settings.json"],
          runtimeSurfaces: [".hforge/runtime/index.json", ".hforge/runtime/README.md"],
          supportMode: "native",
          authoritativeSurfaces: [
            ".hforge/library/skills",
            ".hforge/library/rules",
            ".hforge/library/knowledge",
            ".hforge/templates",
            ".hforge/runtime"
          ],
          visibleBridgePaths: ["AGENTS.md", "CLAUDE.md", ".agents/skills", ".specify", ".claude"],
          visibilityMode: "hidden-ai-layer"
        }
      },
      { workspaceRoot: tempRoot }
    );

    await applyInstall(tempRoot, plan);

    const [agentsBridge, claudeBridge] = await Promise.all([
      fs.readFile(path.join(tempRoot, "AGENTS.md"), "utf8"),
      fs.readFile(path.join(tempRoot, "CLAUDE.md"), "utf8")
    ]);

    expect(agentsBridge).toContain("Harness Forge");
    expect(claudeBridge).toContain("Harness Forge");
  });
});
