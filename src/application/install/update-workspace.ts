import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { loadBundleManifests, loadProfileManifests } from "../../domain/manifests/index.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { loadTargetAdapter } from "../../domain/targets/adapter.js";
import { ValidationError, PACKAGE_ROOT, STATE_DIR, writeJsonFile, readJsonFile } from "../../shared/index.js";
import { createInstallPlan } from "./plan-install.js";
import { applyInstall } from "./apply-install.js";

export interface UpdateWorkspaceResult {
  workspaceRoot: string;
  currentPackageVersion: string;
  latestPackageVersion: string;
  packageRootUsed: string;
  updatedTargets: string[];
  updatedBundles: string[];
  preservedStateRoots: string[];
  backupPath?: string;
  dryRun: boolean;
  messages: string[];
}

interface UpdateWorkspaceOptions {
  workspaceRoot: string;
  packageTag?: string;
  dryRun?: boolean;
  packageRootOverride?: string;
}

function runNpm(args: string[], cwd: string) {
  if (process.platform === "win32") {
    return spawnSync("cmd.exe", ["/d", "/s", "/c", `npm ${args.join(" ")}`], {
      cwd,
      encoding: "utf8"
    });
  }

  return spawnSync("npm", args, {
    cwd,
    encoding: "utf8"
  });
}

async function resolveLatestPackageRoot(packageTag: string): Promise<{ packageRoot: string; version: string; cleanup: () => Promise<void> }> {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-update-"));
  const result = runNpm(["install", "--ignore-scripts", "--no-save", `@harness-forge/cli@${packageTag}`], tempRoot);
  if ((result.status ?? 1) !== 0) {
    throw new ValidationError(`Failed to download @harness-forge/cli@${packageTag}: ${result.stderr?.trim() || result.stdout?.trim() || "unknown npm error"}`);
  }

  const packageRoot = path.join(tempRoot, "node_modules", "@harness-forge", "cli");
  const packageJson = await readJsonFile<{ version: string }>(path.join(packageRoot, "package.json"));
  return {
    packageRoot,
    version: packageJson.version,
    cleanup: async () => {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  };
}

async function writeUpdateBackup(workspaceRoot: string): Promise<string | undefined> {
  const state = await loadInstallState(workspaceRoot);
  if (!state) {
    return undefined;
  }

  const backupPath = path.join(workspaceRoot, STATE_DIR, `update-backup-${Date.now()}.json`);
  await writeJsonFile(backupPath, state);
  return backupPath;
}

function collectPreservedStateRoots(workspaceRoot: string): string[] {
  return [
    path.join(workspaceRoot, ".hforge", "runtime", "tasks"),
    path.join(workspaceRoot, ".hforge", "runtime", "decisions"),
    path.join(workspaceRoot, ".hforge", "runtime", "recursive", "sessions"),
    path.join(workspaceRoot, ".hforge", "observability")
  ];
}

export async function updateWorkspace(options: UpdateWorkspaceOptions): Promise<UpdateWorkspaceResult> {
  const workspaceRoot = path.resolve(options.workspaceRoot);
  const packageTag = options.packageTag ?? "latest";
  const dryRun = options.dryRun ?? false;
  const [state, currentPackageJson] = await Promise.all([
    loadInstallState(workspaceRoot),
    readJsonFile<{ version: string }>(path.join(PACKAGE_ROOT, "package.json"))
  ]);

  if (!state || state.installedTargets.length === 0) {
    throw new ValidationError(`No installed Harness Forge workspace state found at ${workspaceRoot}. Run init/install first.`);
  }

  const latest = options.packageRootOverride
    ? {
        packageRoot: path.resolve(options.packageRootOverride),
        version: (await readJsonFile<{ version: string }>(path.join(path.resolve(options.packageRootOverride), "package.json"))).version,
        cleanup: async () => {}
      }
    : await resolveLatestPackageRoot(packageTag);
  const backupPath = dryRun ? undefined : await writeUpdateBackup(workspaceRoot);

  try {
    const [bundles, profiles] = await Promise.all([
      loadBundleManifests(latest.packageRoot),
      loadProfileManifests(latest.packageRoot)
    ]);
    const messages: string[] = [];

    for (const targetId of state.installedTargets) {
      const target = await loadTargetAdapter(latest.packageRoot, targetId);
      const plan = createInstallPlan(
        latest.packageRoot,
        {
          targetId,
          profileId: state.setupProfile,
          bundleIds: state.installedBundles,
          languageIds: [],
          frameworkIds: [],
          capabilityIds: [],
          rootPath: workspaceRoot,
          mode: dryRun ? "dry-run" : "apply"
        },
        bundles,
        profiles,
        target,
        { workspaceRoot }
      );

      if (!dryRun) {
        const applied = await applyInstall(workspaceRoot, plan, latest.packageRoot);
        messages.push(...applied.messages);
      } else {
        messages.push(`Planned refresh for ${targetId}: ${plan.operations.length} operations.`);
      }
    }

    if (!dryRun) {
      const refreshed = await loadInstallState(workspaceRoot);
      if (refreshed) {
        await saveInstallState(workspaceRoot, {
          ...refreshed,
          packageVersion: latest.version,
          lastAction: "update",
          timestamps: {
            ...refreshed.timestamps,
            updatedAt: new Date().toISOString()
          }
        });
      }
    }

    return {
      workspaceRoot,
      currentPackageVersion: state.packageVersion ?? currentPackageJson.version,
      latestPackageVersion: latest.version,
      packageRootUsed: latest.packageRoot,
      updatedTargets: state.installedTargets,
      updatedBundles: state.installedBundles,
      preservedStateRoots: collectPreservedStateRoots(workspaceRoot),
      ...(backupPath ? { backupPath } : {}),
      dryRun,
      messages
    };
  } finally {
    await latest.cleanup();
  }
}
