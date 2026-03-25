import path from "node:path";
import { Command } from "commander";

import { createUpgradeSurfaceReport } from "../../application/maintenance/upgrade-surface.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerUpgradeSurfaceCommands(program: Command): void {
  program
    .command("upgrade-surface")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = await createUpgradeSurfaceReport(workspaceRoot, PACKAGE_ROOT);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "upgrade-surface-run",
        subjectId: "upgrade-surface",
        result: result.installedTargets.length > 0 ? "accepted" : "skipped",
        recordedAt: new Date().toISOString(),
        details: { installedTargets: result.installedTargets.length }
      });
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
