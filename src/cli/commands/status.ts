import { Command } from "commander";
import path from "node:path";

import { loadInstallState } from "../../domain/state/install-state.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerStatusCommands(program: Command): void {
  program
    .command("status")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const state = await loadInstallState(workspaceRoot);
      if (options.json) {
        console.log(toJson(state));
        return;
      }
      if (!state) {
        console.log(`No install state found at ${workspaceRoot}. Run "hforge init --root ${workspaceRoot}" first.`);
        return;
      }

      console.log(`Workspace: ${workspaceRoot}`);
      console.log(`Package version: ${state.packageVersion ?? "unknown"}`);
      console.log(`Runtime schema version: ${state.runtimeSchemaVersion ?? "unknown"}`);
      console.log(`Installed targets: ${state.installedTargets.join(", ") || "none"}`);
      console.log(`Installed bundles: ${state.installedBundles.length}`);
      console.log(`Visibility mode: ${state.visibilityMode ?? "unknown"}`);
      console.log(`Last action: ${state.lastAction ?? "unknown"}`);
      console.log(`Updated at: ${state.timestamps.updatedAt}`);
    });
}
