import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyInstall } from "../../src/application/install/apply-install.js";
import { bootstrapWorkspace } from "../../src/application/install/bootstrap-workspace.js";
import { createInstallPlan } from "../../src/application/install/plan-install.js";
import { reconcileState } from "../../src/application/install/reconcile-state.js";
import { loadInstallState } from "../../src/domain/state/install-state.js";

const repoRoot = process.cwd();
const tempRoots: string[] = [];
const fixtureRoot = path.join(repoRoot, "tests", "fixtures", "runtime");

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("aio v2 runtime flow integration", () => {
  it("adds a shared runtime to install plans", () => {
    const plan = createInstallPlan(
      repoRoot,
      {
        targetId: "codex",
        profileId: "core",
        bundleIds: ["baseline:agents"],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: repoRoot,
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
      }
    );

    expect(plan.visibilityPolicy.mode).toBe("hidden-ai-layer");
    expect(plan.visibilityPolicy.hiddenCanonicalRoots.some((entry) => entry.endsWith(path.join(".hforge", "library", "skills")))).toBe(
      true
    );
    expect(plan.sharedRuntime?.rootDir.endsWith(path.join(".hforge", "runtime"))).toBe(true);
    expect(plan.sharedRuntime?.targets.some((target) => target.targetId === "codex")).toBe(true);
    expect(plan.sharedRuntime?.discoveryBridges.some((bridge) => bridge.path.endsWith("AGENTS.md"))).toBe(true);
    expect(plan.sharedRuntime?.baselineArtifacts.some((artifact) => artifact.id === "repo-map")).toBe(true);
    expect(plan.sharedRuntime?.authoritativeSurfaces.some((entry) => entry.endsWith(path.join(".hforge", "library", "skills")))).toBe(
      true
    );
  });

  it("writes shared runtime artifacts during apply", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-aio-v2-"));
    tempRoots.push(tempRoot);

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

    const indexPath = path.join(tempRoot, ".hforge", "runtime", "index.json");
    const readmePath = path.join(tempRoot, ".hforge", "runtime", "README.md");
    const repoMapPath = path.join(tempRoot, ".hforge", "runtime", "repo", "repo-map.json");
    const recommendationsPath = path.join(tempRoot, ".hforge", "runtime", "repo", "recommendations.json");
    const riskSignalsPath = path.join(tempRoot, ".hforge", "runtime", "findings", "risk-signals.json");
    const [index, readme, installState] = await Promise.all([
      fs.readFile(indexPath, "utf8"),
      fs.readFile(readmePath, "utf8"),
      loadInstallState(tempRoot)
    ]);
    const runtimeIndex = JSON.parse(index) as {
      rootDir: string;
      visibilityMode?: string;
      authoritativeSurfaces?: string[];
      visibleBridgePaths?: string[];
      targets: Array<{ targetId: string }>;
      baselineArtifacts: Array<{ id: string; path: string }>;
    };

    expect(runtimeIndex.rootDir).toBe(".hforge/runtime");
    expect(runtimeIndex.visibilityMode).toBe("hidden-ai-layer");
    expect(runtimeIndex.authoritativeSurfaces).toContain(".hforge/library/skills");
    expect(runtimeIndex.visibleBridgePaths).toContain("AGENTS.md");
    expect(runtimeIndex.targets.map((target) => target.targetId)).toContain("codex");
    expect(runtimeIndex.baselineArtifacts.some((artifact) => artifact.id === "repo-map")).toBe(true);
    expect(readme).toContain(".hforge/library/skills");
    expect(readme).toContain(".hforge/runtime");
    expect(await fs.readFile(repoMapPath, "utf8")).toContain("\"workspaceId\"");
    expect(await fs.readFile(recommendationsPath, "utf8")).toContain("\"recommendations\"");
    expect(await fs.readFile(riskSignalsPath, "utf8")).toContain("[");
    expect(installState?.fileWrites).toContain(indexPath);
    expect(installState?.fileWrites).toContain(readmePath);
    expect(installState?.fileWrites).toContain(repoMapPath);
    expect(installState?.fileWrites).toContain(recommendationsPath);
  });

  it("aggregates multiple targets into one shared runtime document during bootstrap", { timeout: 15_000 }, async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-aio-v2-multi-"));
    tempRoots.push(tempRoot);

    await fs.copyFile(
      path.join(fixtureRoot, "multi-target-install", "package.json"),
      path.join(tempRoot, "package.json")
    );

    const result = await bootstrapWorkspace({
      packageRoot: repoRoot,
      workspaceRoot: tempRoot,
      targetIds: ["codex", "claude-code"],
      mode: "apply"
    });

    const indexPath = path.join(tempRoot, ".hforge", "runtime", "index.json");
    const runtimeIndex = JSON.parse(await fs.readFile(indexPath, "utf8")) as {
      targets: Array<{ targetId: string }>;
    };

    expect(result.sharedRuntimeRoots).toEqual([path.join(tempRoot, ".hforge", "runtime")]);
    expect(runtimeIndex.targets.map((target) => target.targetId).sort()).toEqual(["claude-code", "codex"]);
    expect(await fs.readFile(path.join(tempRoot, ".hforge", "runtime", "repo", "instruction-plan.json"), "utf8")).toContain(
      "\"plans\""
    );
  });

  it("marks runtime target drift when the shared runtime document loses installed targets", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-aio-v2-drift-"));
    tempRoots.push(tempRoot);

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

    const indexPath = path.join(tempRoot, ".hforge", "runtime", "index.json");
    const runtimeIndex = JSON.parse(await fs.readFile(indexPath, "utf8")) as Record<string, unknown>;
    runtimeIndex.targets = [];
    await fs.writeFile(indexPath, `${JSON.stringify(runtimeIndex, null, 2)}\n`, "utf8");

    const reconciliation = await reconcileState(tempRoot);
    expect(reconciliation.status).toBe("drifted");
    expect(reconciliation.missing.some((entry) => entry.includes("#targets/codex"))).toBe(true);
  });
});
