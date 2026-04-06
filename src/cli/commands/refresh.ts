import path from "node:path";
import { Command } from "commander";

import { refreshWorkspaceRuntime } from "../../application/install/refresh-workspace-runtime.js";
import { compactLoopData } from "../../application/loop/loop-data-compactor.js";
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
        },
        category: "maintenance",
        confidenceLevel: "direct"
      });

      // Auto-compact loop data silently
      try {
        const compaction = await compactLoopData(workspaceRoot);
        const total = compaction.tracesCompacted + compaction.tracesDeleted;
        if (total > 0 && !options.json) {
          const kbFreed = (compaction.bytesFreed / 1024).toFixed(1);
          console.log(`Loop data: compacted ${total} traces, freed ${kbFreed} KB`);
        }
      } catch {
        // Compaction is best-effort during refresh — do not fail the command
      }

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Refreshed shared runtime for ${workspaceRoot}`);
      console.log(`Targets: ${result.targetIds.join(", ")}`);
      console.log(`Runtime index: ${result.runtimeIndexPath}`);
    });
}
