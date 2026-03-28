import path from "node:path";
import { Command } from "commander";

import { refreshWorkspaceRuntime } from "../../application/install/refresh-workspace-runtime.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";

export function registerRefreshCommands(program: Command): void {
  program
    .command("refresh")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = await refreshWorkspaceRuntime(workspaceRoot);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "refresh-run",
        subjectId: "refresh",
        result: "success",
        recordedAt: new Date().toISOString(),
        details: {
          targets: result.targetIds.length,
          runtimeSchemaVersion: result.runtimeSchemaVersion
        }
      });

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Refreshed shared runtime for ${workspaceRoot}`);
      console.log(`Targets: ${result.targetIds.join(", ")}`);
      console.log(`Runtime index: ${result.runtimeIndexPath}`);
    });
}
