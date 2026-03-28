import path from "node:path";

import type { InstallPlan } from "../../domain/operations/install-plan.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { loadTargetAdapter } from "../../domain/targets/adapter.js";
import {
  PACKAGE_ROOT,
  RUNTIME_DIR,
  RUNTIME_INDEX_FILE,
  RUNTIME_SCHEMA_VERSION,
  ValidationError,
  readJsonFile
} from "../../shared/index.js";
import { writeAgentManifest } from "./agent-manifest.js";
import { createSharedRuntimePlan, writeSharedRuntime } from "./shared-runtime.js";

export interface RefreshWorkspaceRuntimeResult {
  workspaceRoot: string;
  targetIds: string[];
  runtimeIndexPath: string;
  runtimeSchemaVersion: number;
  packageVersion: string;
}

function createRefreshPlan(workspaceRoot: string, targetId: string): InstallPlan {
  return {
    planId: `refresh-${targetId}`,
    selection: {
      targetId,
      bundleIds: [],
      languageIds: [],
      frameworkIds: [],
      capabilityIds: [],
      rootPath: workspaceRoot,
      mode: "apply"
    },
    operations: [],
    visibilityPolicy: {
      mode: "hidden-ai-layer",
      aiLayerRoot: path.join(workspaceRoot, ".hforge"),
      hiddenCanonicalRoots: [],
      visibleBridgePaths: []
    },
    sharedRuntime: undefined,
    warnings: [],
    conflicts: [],
    backupRequirements: [],
    hash: `refresh-${targetId}`,
    validationSummary: ["shared runtime refresh"]
  };
}

export async function refreshWorkspaceRuntime(
  workspaceRoot: string,
  packageRoot = PACKAGE_ROOT
): Promise<RefreshWorkspaceRuntimeResult> {
  const [state, packageJson] = await Promise.all([
    loadInstallState(workspaceRoot),
    readJsonFile<{ version: string }>(path.join(packageRoot, "package.json"))
  ]);

  if (!state || state.installedTargets.length === 0) {
    throw new ValidationError(
      `No installed targets were found for ${workspaceRoot}. Run "hforge install --target <target> --root ${workspaceRoot} --yes" or "hforge bootstrap --root ${workspaceRoot} --yes" first.`
    );
  }

  for (const targetId of state.installedTargets) {
    const adapter = await loadTargetAdapter(packageRoot, targetId);
    const plan = createRefreshPlan(workspaceRoot, targetId);
    plan.sharedRuntime = createSharedRuntimePlan(workspaceRoot, targetId, adapter);
    plan.visibilityPolicy.hiddenCanonicalRoots = plan.sharedRuntime.authoritativeSurfaces;
    plan.visibilityPolicy.visibleBridgePaths = plan.sharedRuntime.visibleBridgePaths;
    await writeSharedRuntime(workspaceRoot, plan);
  }
  await writeAgentManifest(workspaceRoot, packageRoot);

  await saveInstallState(workspaceRoot, {
    ...state,
    packageVersion: packageJson.version,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    lastAction: "refresh",
    timestamps: {
      ...state.timestamps,
      updatedAt: new Date().toISOString()
    }
  });

  return {
    workspaceRoot,
    targetIds: state.installedTargets,
    runtimeIndexPath: path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INDEX_FILE),
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    packageVersion: packageJson.version
  };
}
