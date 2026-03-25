import path from "node:path";
import { Command } from "commander";

import { createPrunePlan } from "../../application/maintenance/prune-install.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerPruneCommands(program: Command): void {
  program
    .command("prune")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--yes", "persist pruned state", false)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = await createPrunePlan(workspaceRoot, options.yes);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "prune-run",
        subjectId: "prune",
        result: result.removed.length > 0 ? "accepted" : "skipped",
        recordedAt: new Date().toISOString(),
        details: { removed: result.removed.length }
      });
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
