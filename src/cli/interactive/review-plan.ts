import path from "node:path";

import { applyInstall } from "../../application/install/apply-install.js";
import { initializeWorkspace } from "../../application/install/initialize-workspace.js";
import { createInstallPlan } from "../../application/install/plan-install.js";
import { validateEnvironment } from "../../application/install/validate-environment.js";
import { loadBundleManifests, loadProfileManifests } from "../../domain/manifests/index.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { loadTargetAdapter } from "../../domain/targets/adapter.js";
import { PACKAGE_ROOT, STATE_DIR } from "../../shared/index.js";
import type { ExecutionSummary } from "./session-state.js";
import type { SetupIntent } from "./setup-intent.js";
import { getSetupProfileDescriptor, OPTIONAL_MODULE_LABELS } from "./setup-intent.js";

export interface PlannedWrite {
  path: string;
  kind: "runtime" | "bridge" | "state" | "generated";
  description: string;
}

export interface ReviewPlanDocument {
  workspaceRoot: string;
  targetIds: string[];
  setupProfile: string;
  enabledModules: string[];
  plannedWrites: PlannedWrite[];
  warnings: string[];
  directCommandPreview: string;
}

function createInitWrites(workspaceRoot: string): PlannedWrite[] {
  return [
    {
      path: path.join(workspaceRoot, STATE_DIR, "install-state.json"),
      kind: "state",
      description: "Workspace install-state and runtime version tracking."
    },
    {
      path: path.join(workspaceRoot, ".hforge", "runtime", "index.json"),
      kind: "runtime",
      description: "Shared runtime index for the workspace."
    },
    {
      path: path.join(workspaceRoot, ".hforge", "runtime", "README.md"),
      kind: "runtime",
      description: "Human-readable runtime summary and guidance."
    },
    {
      path: path.join(workspaceRoot, ".hforge", "agent-manifest.json"),
      kind: "generated",
      description: "Machine-readable custom-agent manifest for bridges, canonical roots, and safe command discovery."
    },
    {
      path: path.join(workspaceRoot, STATE_DIR, "post-install-guidance.txt"),
      kind: "state",
      description: "Operator next steps and recovery guidance."
    }
  ];
}

async function createTargetPlans(intent: SetupIntent) {
  const [bundles, profiles] = await Promise.all([loadBundleManifests(PACKAGE_ROOT), loadProfileManifests(PACKAGE_ROOT)]);
  const profileDescriptor = getSetupProfileDescriptor(intent.setupProfile);

  return Promise.all(
    intent.targetIds.map(async (targetId) => {
      const [warnings, target] = await Promise.all([
        validateEnvironment(PACKAGE_ROOT, targetId),
        loadTargetAdapter(PACKAGE_ROOT, targetId)
      ]);

      const plan = createInstallPlan(
        PACKAGE_ROOT,
        {
          targetId,
          profileId: profileDescriptor.manifestProfileId,
          bundleIds: [],
          languageIds: [],
          frameworkIds: [],
          capabilityIds: [],
          rootPath: intent.workspaceRoot,
          mode: intent.dryRun || !intent.applyChanges ? "dry-run" : "apply"
        },
        bundles,
        profiles,
        target,
        { workspaceRoot: intent.workspaceRoot }
      );
      plan.warnings.push(...warnings);
      return plan;
    })
  );
}

export async function buildReviewPlan(intent: SetupIntent): Promise<ReviewPlanDocument> {
  const installPlans = await createTargetPlans(intent);
  const plannedWrites: PlannedWrite[] = [...createInitWrites(intent.workspaceRoot)];

  for (const plan of installPlans) {
    for (const operation of plan.operations) {
      plannedWrites.push({
        path: operation.destinationPath,
        kind: operation.destinationPath.includes(".hforge") ? "runtime" : "bridge",
        description: `${plan.selection.targetId}: ${operation.reason}`
      });
    }
  }

  const warnings = installPlans.flatMap((plan) => [...plan.warnings, ...plan.conflicts]);
  const modules = intent.enabledModules.map((moduleId) => OPTIONAL_MODULE_LABELS[moduleId]);
  const agentFlags = intent.targetIds.map((targetId) => `--agent ${targetId}`).join(" ");

  return {
    workspaceRoot: intent.workspaceRoot,
    targetIds: intent.targetIds,
    setupProfile: intent.setupProfile,
    enabledModules: modules,
    plannedWrites,
    warnings: [...new Set(warnings)],
    directCommandPreview: `hforge init --root ${intent.workspaceRoot} ${agentFlags} --setup-profile ${intent.setupProfile}${intent.dryRun ? " --dry-run" : " --yes"}`
  };
}

export async function applySetupIntent(intent: SetupIntent): Promise<ExecutionSummary> {
  const reviewPlan = await buildReviewPlan(intent);
  if (intent.dryRun || !intent.applyChanges) {
    return {
      status: "preview",
      workspaceRoot: intent.workspaceRoot,
      appliedTargets: intent.targetIds,
      writtenArtifacts: reviewPlan.plannedWrites.map((item) => item.path),
      preservedArtifacts: [],
      nextSuggestedCommands: [reviewPlan.directCommandPreview, `hforge status --root ${intent.workspaceRoot}`],
      importantPaths: [
        path.join(intent.workspaceRoot, ".hforge", "runtime", "index.json"),
        path.join(intent.workspaceRoot, ".hforge", "state", "install-state.json")
      ],
      operatorMessage: "Preview only. No files were written."
    };
  }

  const initializeResult = await initializeWorkspace(intent.workspaceRoot, PACKAGE_ROOT);
  const installPlans = await createTargetPlans(intent);
  const writtenArtifacts = [...initializeResult.changedFiles];
  const localLauncher =
    process.platform === "win32"
      ? initializeResult.launcherPaths.find((entry) => entry.endsWith("hforge.cmd")) ?? initializeResult.launcherPaths[0]
      : initializeResult.launcherPaths.find((entry) => entry.endsWith(`${path.sep}hforge`)) ?? initializeResult.launcherPaths[0];

  for (const plan of installPlans) {
    await applyInstall(intent.workspaceRoot, plan);
    writtenArtifacts.push(...plan.operations.map((operation) => operation.destinationPath));
  }

  const existingState = await loadInstallState(intent.workspaceRoot);
  if (existingState) {
    await saveInstallState(intent.workspaceRoot, {
      ...existingState,
      preferredTargets: intent.targetIds,
      setupProfile: intent.setupProfile,
      enabledModules: intent.enabledModules,
      lastAction: intent.targetIds.length > 0 ? "install" : "init",
      timestamps: {
        ...existingState.timestamps,
        updatedAt: new Date().toISOString()
      }
    });
  }

  return {
    status: "success",
    workspaceRoot: intent.workspaceRoot,
    appliedTargets: intent.targetIds,
    writtenArtifacts,
    preservedArtifacts: [],
    nextSuggestedCommands: [
      `${localLauncher} status --root ${intent.workspaceRoot}`,
      `${localLauncher} refresh --root ${intent.workspaceRoot}`,
      `${localLauncher} review --root ${intent.workspaceRoot}`
    ],
    importantPaths: [
      initializeResult.agentManifestPath,
      initializeResult.runtimeIndexPath,
      initializeResult.statePath,
      ...initializeResult.launcherPaths,
      path.join(intent.workspaceRoot, ".hforge", "generated", "agent-command-catalog.json")
    ],
    operatorMessage: `Initialized Harness Forge at ${intent.workspaceRoot} with ${intent.targetIds.length} target${intent.targetIds.length === 1 ? "" : "s"}.`
  };
}
