import path from "node:path";

import { loadInstallState } from "../../domain/state/install-state.js";
import { readJsonFile } from "../../shared/index.js";

export async function createUpgradeSurfaceReport(workspaceRoot: string, packageRoot: string): Promise<{
  packageVersion: string;
  installedTargets: string[];
  installedBundles: string[];
  recommendation: string;
}> {
  const [state, packageJson] = await Promise.all([
    loadInstallState(workspaceRoot),
    readJsonFile<{ version: string }>(path.join(packageRoot, "package.json"))
  ]);

  return {
    packageVersion: packageJson.version,
    installedTargets: state?.installedTargets ?? [],
    installedBundles: state?.installedBundles ?? [],
    recommendation: state
      ? "Run install again with the current target and bundle set, then re-run doctor and release validation."
      : "No install state found. Initialize and install a target surface first."
  };
}
