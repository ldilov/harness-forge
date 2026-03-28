import path from "node:path";

import { loadBundleManifests } from "../../domain/manifests/index.js";
import { loadInstallState } from "../../domain/state/install-state.js";
import { reconcileState } from "../install/reconcile-state.js";
import { readJsonFile } from "../../shared/index.js";
import { listStaleTaskAnalysisArtifacts } from "../runtime/task-runtime-store.js";

interface PackageSurfaceManifest {
  requiredPaths: string[];
}

export interface AuditReport {
  workspaceRoot: string;
  packageVersion: string;
  installedTargets: string[];
  installedBundles: string[];
  missingManagedPaths: string[];
  missingBundles: string[];
  packageSurfaceMissingPaths: string[];
  staleTaskArtifacts: Array<{
    path: string;
    taskId: string;
    artifactType: "file-interest" | "impact-analysis" | "task-pack";
    reasons: string[];
  }>;
}

export async function createAuditReport(workspaceRoot: string, packageRoot: string): Promise<AuditReport> {
  const state = await loadInstallState(workspaceRoot);
  const [reconcile, bundles, packageJson, packageSurface] = await Promise.all([
    reconcileState(workspaceRoot),
    loadBundleManifests(packageRoot),
    readJsonFile<{ version: string }>(path.join(packageRoot, "package.json")),
    readJsonFile<PackageSurfaceManifest>(path.join(packageRoot, "manifests", "catalog", "package-surface.json"))
  ]);

  const knownBundleIds = new Set(bundles.map((bundle) => bundle.id));
  const missingBundles = (state?.installedBundles ?? []).filter((bundleId) => !knownBundleIds.has(bundleId));

  return {
    workspaceRoot,
    packageVersion: packageJson.version,
    installedTargets: state?.installedTargets ?? [],
    installedBundles: state?.installedBundles ?? [],
    missingManagedPaths: reconcile.missing,
    missingBundles,
    packageSurfaceMissingPaths: await Promise.all(
      packageSurface.requiredPaths.map(async (relativePath) => ({
        relativePath,
        exists: await import("../../shared/index.js").then(({ exists }) => exists(path.join(packageRoot, relativePath)))
      }))
    ).then((values) => values.filter((value) => !value.exists).map((value) => value.relativePath)),
    staleTaskArtifacts: await listStaleTaskAnalysisArtifacts(workspaceRoot)
  };
}
