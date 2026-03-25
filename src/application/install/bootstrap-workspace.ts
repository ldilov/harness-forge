import { applyInstall } from "./apply-install.js";
import { createInstallPlan } from "./plan-install.js";
import { discoverWorkspaceTargets, type DiscoveredWorkspaceTarget } from "./discover-workspace-targets.js";
import { recommendBundles } from "../recommendations/recommend-bundles.js";
import { recommendFromIntelligence } from "../recommendations/recommend-from-intelligence.js";
import { loadBundleManifests, loadProfileManifests } from "../../domain/manifests/index.js";
import { loadTargetAdapter } from "../../domain/targets/adapter.js";
import type { InstallPlan } from "../../domain/operations/install-plan.js";
import { validateEnvironment } from "./validate-environment.js";

interface BootstrapWorkspaceOptions {
  packageRoot: string;
  workspaceRoot: string;
  profileId?: string;
  targetIds?: string[];
  bundleIds?: string[];
  languageIds?: string[];
  frameworkIds?: string[];
  capabilityIds?: string[];
  mode: "apply" | "dry-run";
}

export interface BootstrapWorkspacePlan {
  workspaceRoot: string;
  discoveredTargets: DiscoveredWorkspaceTarget[];
  targetIds: string[];
  recommendedProfileId: string;
  recommendedBundleIds: string[];
  plans: InstallPlan[];
}

export interface BootstrapWorkspaceResult extends BootstrapWorkspacePlan {
  applied: Array<{
    targetId: string;
    messages: string[];
    guidancePath: string;
  }>;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function splitBundleIds(bundleIds: string[]): {
  bundleIds: string[];
  languageIds: string[];
  frameworkIds: string[];
  capabilityIds: string[];
} {
  const next = {
    bundleIds: [] as string[],
    languageIds: [] as string[],
    frameworkIds: [] as string[],
    capabilityIds: [] as string[]
  };

  for (const bundleId of bundleIds) {
    if (bundleId.startsWith("lang:")) {
      next.languageIds.push(bundleId.slice("lang:".length));
      continue;
    }
    if (bundleId.startsWith("framework:")) {
      next.frameworkIds.push(bundleId.slice("framework:".length));
      continue;
    }
    if (bundleId.startsWith("capability:")) {
      next.capabilityIds.push(bundleId.slice("capability:".length));
      continue;
    }

    next.bundleIds.push(bundleId);
  }

  return {
    bundleIds: unique(next.bundleIds),
    languageIds: unique(next.languageIds),
    frameworkIds: unique(next.frameworkIds),
    capabilityIds: unique(next.capabilityIds)
  };
}

export async function planBootstrapWorkspace(options: BootstrapWorkspaceOptions): Promise<BootstrapWorkspacePlan> {
  const discoveredTargets = await discoverWorkspaceTargets(options.workspaceRoot);
  const targetIds = unique(options.targetIds?.length ? options.targetIds : discoveredTargets.map((target) => target.targetId));
  const [bundles, profiles, lightweightRecommendations, intelligence] = await Promise.all([
    loadBundleManifests(options.packageRoot),
    loadProfileManifests(options.packageRoot),
    recommendBundles(options.workspaceRoot),
    recommendFromIntelligence(options.workspaceRoot)
  ]);

  const recommendedProfileId =
    options.profileId ?? intelligence.recommendations.profiles[0]?.id ?? "core";
  const recommendedBundleIds = unique([
    ...lightweightRecommendations,
    ...intelligence.recommendations.bundles.map((recommendation) => recommendation.id)
  ]);
  const splitRecommended = splitBundleIds(recommendedBundleIds);
  const requested = {
    bundleIds: unique([...(options.bundleIds ?? []), ...splitRecommended.bundleIds]),
    languageIds: unique([...(options.languageIds ?? []), ...splitRecommended.languageIds]),
    frameworkIds: unique([...(options.frameworkIds ?? []), ...splitRecommended.frameworkIds]),
    capabilityIds: unique([...(options.capabilityIds ?? []), ...splitRecommended.capabilityIds])
  };

  const plans: InstallPlan[] = [];
  for (const targetId of targetIds) {
    const [warnings, target] = await Promise.all([
      validateEnvironment(options.packageRoot, targetId),
      loadTargetAdapter(options.packageRoot, targetId)
    ]);

    const plan = createInstallPlan(
      options.packageRoot,
      {
        targetId,
        profileId: recommendedProfileId,
        bundleIds: requested.bundleIds,
        languageIds: requested.languageIds,
        frameworkIds: requested.frameworkIds,
        capabilityIds: requested.capabilityIds,
        rootPath: options.workspaceRoot,
        mode: options.mode
      },
      bundles,
      profiles,
      target,
      { workspaceRoot: options.workspaceRoot }
    );

    plan.warnings.push(...warnings);
    plans.push(plan);
  }

  return {
    workspaceRoot: options.workspaceRoot,
    discoveredTargets,
    targetIds,
    recommendedProfileId,
    recommendedBundleIds,
    plans
  };
}

export async function bootstrapWorkspace(options: BootstrapWorkspaceOptions): Promise<BootstrapWorkspaceResult> {
  const plan = await planBootstrapWorkspace(options);
  const applied: BootstrapWorkspaceResult["applied"] = [];

  if (options.mode === "apply") {
    for (const targetPlan of plan.plans) {
      const result = await applyInstall(options.workspaceRoot, targetPlan);
      applied.push({
        targetId: targetPlan.selection.targetId,
        messages: result.messages,
        guidancePath: result.guidancePath
      });
    }
  }

  return {
    ...plan,
    applied
  };
}
