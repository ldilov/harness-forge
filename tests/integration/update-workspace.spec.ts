import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyInstall } from "../../src/application/install/apply-install.js";
import { createInstallPlan } from "../../src/application/install/plan-install.js";
import { updateWorkspace } from "../../src/application/install/update-workspace.js";
import { loadBundleManifests, loadProfileManifests } from "../../src/domain/manifests/index.js";
import { loadInstallState } from "../../src/domain/state/install-state.js";
import { loadTargetAdapter } from "../../src/domain/targets/adapter.js";

const root = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("workspace update integration", () => {
  it("refreshes managed Harness Forge surfaces without deleting gathered runtime state", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-update-"));
    tempRoots.push(workspaceRoot);
    await fs.writeFile(
      path.join(workspaceRoot, "package.json"),
      `${JSON.stringify({ name: "update-workspace-fixture", private: true, version: "1.0.0" }, null, 2)}\n`,
      "utf8"
    );

    const [bundles, profiles, target] = await Promise.all([
      loadBundleManifests(root),
      loadProfileManifests(root),
      loadTargetAdapter(root, "codex")
    ]);

    const plan = createInstallPlan(
      root,
      {
        targetId: "codex",
        profileId: "recommended",
        bundleIds: [],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: workspaceRoot,
        mode: "apply"
      },
      bundles,
      profiles,
      target,
      { workspaceRoot }
    );

    await applyInstall(workspaceRoot, plan);

    const preservedFiles = [
      path.join(workspaceRoot, ".hforge", "runtime", "tasks", "TASK-900", "task-pack.json"),
      path.join(workspaceRoot, ".hforge", "runtime", "decisions", "index.json"),
      path.join(workspaceRoot, ".hforge", "runtime", "recursive", "sessions", "RS-900", "summary.json"),
      path.join(workspaceRoot, ".hforge", "observability", "summary.json")
    ];
    for (const filePath of preservedFiles) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify({ preserved: path.basename(filePath) }, null, 2), "utf8");
    }

    const result = await updateWorkspace({
      workspaceRoot,
      packageRootOverride: root
    });

    expect(result.dryRun).toBe(false);
    expect(result.updatedTargets).toContain("codex");
    expect(result.preservedStateRoots).toEqual(
      expect.arrayContaining([
        path.join(workspaceRoot, ".hforge", "runtime", "tasks"),
        path.join(workspaceRoot, ".hforge", "runtime", "decisions"),
        path.join(workspaceRoot, ".hforge", "runtime", "recursive", "sessions"),
        path.join(workspaceRoot, ".hforge", "observability")
      ])
    );
    expect(result.backupPath).toContain(path.join(".hforge", "state", "update-backup-"));

    for (const filePath of preservedFiles) {
      await expect(fs.readFile(filePath, "utf8")).resolves.toContain("\"preserved\"");
    }

    const installState = await loadInstallState(workspaceRoot);
    const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8")) as { version: string };
    expect(installState?.lastAction).toBe("update");
    expect(installState?.packageVersion).toBe(packageJson.version);
    await expect(fs.access(path.join(workspaceRoot, ".hforge", "generated", "agent-command-catalog.json"))).resolves.toBeUndefined();
  });
});
