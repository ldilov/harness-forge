import crypto from "node:crypto";
import path from "node:path";

import type { BundleManifest, ProfileManifest } from "../../domain/manifests/index.js";
import type { TargetAdapter } from "../../domain/targets/adapter.js";
import type { InstallPlan, InstallSelection, InstallOperation } from "../../domain/operations/install-plan.js";
import { normalizeTargetPath } from "../../infrastructure/filesystem/normalize-target-path.js";
import { resolveBundles } from "../planning/resolve-bundles.js";

function createOperation(root: string, target: TargetAdapter, bundle: BundleManifest, assetPath: string): InstallOperation {
  const destinationHint = target.pathMappings[assetPath] ?? assetPath;
  const mergeStrategy = target.mergeRules[assetPath] ?? "copy";
  return {
    type:
      mergeStrategy === "append-once"
        ? "append-once"
        : mergeStrategy === "remove"
          ? "remove"
          : mergeStrategy === "skip"
            ? "skip"
            : mergeStrategy.startsWith("merge")
              ? "merge"
              : "copy",
    bundleId: bundle.id,
    sourcePath: path.join(root, assetPath),
    destinationPath: normalizeTargetPath(root, destinationHint),
    mergeStrategy,
    reason: `${bundle.id}:${assetPath}`,
    riskLevel: "low",
    backupRequired: true
  };
}

export function createInstallPlan(
  root: string,
  selection: InstallSelection,
  bundles: BundleManifest[],
  profiles: ProfileManifest[],
  target: TargetAdapter
): InstallPlan {
  const requestedBundleIds = [
    ...selection.bundleIds,
    ...selection.languageIds.map((id) => `lang:${id}`),
    ...selection.frameworkIds.map((id) => `framework:${id}`),
    ...selection.capabilityIds.map((id) => `capability:${id}`)
  ];

  const resolved = resolveBundles(bundles, profiles, selection.profileId, requestedBundleIds);
  const operations = resolved.selected.flatMap((bundle) => bundle.paths.map((assetPath) => createOperation(root, target, bundle, assetPath)));
  const hash = crypto.createHash("sha256").update(JSON.stringify({ selection, operations })).digest("hex");

  return {
    planId: crypto.randomUUID(),
    selection,
    operations,
    warnings: resolved.warnings,
    conflicts: resolved.conflicts,
    backupRequirements: operations.filter((item) => item.backupRequired).map((item) => item.destinationPath),
    hash,
    validationSummary: [
      `${resolved.selected.length} bundles selected`,
      `${operations.length} operations planned`
    ]
  };
}
