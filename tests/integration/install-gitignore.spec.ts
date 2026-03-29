import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyInstall } from "../../src/application/install/apply-install.js";
import { createInstallPlan } from "../../src/application/install/plan-install.js";
import { loadBundleManifests, loadProfileManifests } from "../../src/domain/manifests/index.js";
import { loadInstallState } from "../../src/domain/state/install-state.js";
import { loadTargetAdapter } from "../../src/domain/targets/adapter.js";

const repoRoot = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

async function installCodexWorkspace(workspaceRoot: string): Promise<void> {
  await fs.writeFile(
    path.join(workspaceRoot, "package.json"),
    `${JSON.stringify({ name: "install-gitignore-fixture", private: true, version: "1.0.0" }, null, 2)}\n`,
    "utf8"
  );

  const [bundles, profiles, target] = await Promise.all([
    loadBundleManifests(repoRoot),
    loadProfileManifests(repoRoot),
    loadTargetAdapter(repoRoot, "codex")
  ]);

  const plan = createInstallPlan(
    repoRoot,
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
}

describe("install gitignore integration", () => {
  it("creates a local-first gitignore entry set for the hidden ai layer", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-install-gitignore-"));
    tempRoots.push(workspaceRoot);

    await installCodexWorkspace(workspaceRoot);

    const gitignore = await fs.readFile(path.join(workspaceRoot, ".gitignore"), "utf8");
    const installState = await loadInstallState(workspaceRoot);

    expect(gitignore).toContain(".hforge/");
    expect(gitignore).toContain(".hforge/cache/");
    expect(gitignore).toContain(".hforge/exports/");
    expect(installState?.fileWrites).toContain(path.join(workspaceRoot, ".gitignore"));
  });

  it("appends missing hidden-layer entries without duplicating existing ones", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-install-gitignore-existing-"));
    tempRoots.push(workspaceRoot);
    await fs.writeFile(path.join(workspaceRoot, ".gitignore"), "node_modules/\n.hforge/\n", "utf8");

    await installCodexWorkspace(workspaceRoot);

    const gitignore = await fs.readFile(path.join(workspaceRoot, ".gitignore"), "utf8");
    const lines = gitignore
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    expect(lines).toContain("node_modules/");
    expect(lines).toContain(".hforge/");
    expect(lines).toContain(".hforge/cache/");
    expect(lines).toContain(".hforge/exports/");
    expect(lines.filter((line) => line === ".hforge/")).toHaveLength(1);
  });
});
