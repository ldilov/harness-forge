import path from "node:path";
import { Command } from "commander";

import { syncInstallState } from "../../application/maintenance/sync-install.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerSyncCommands(program: Command): void {
  program
    .command("sync")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--yes", "apply sync changes", false)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = await syncInstallState(workspaceRoot, options.yes);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "sync-run",
        subjectId: "sync",
        result: result.changed ? "accepted" : "skipped",
        recordedAt: new Date().toISOString(),
        details: { changed: result.changed }
      });
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
