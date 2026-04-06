import path from "node:path";
import { Command } from "commander";

import { createPrunePlan } from "../../application/maintenance/prune-install.js";
import { compactLoopData } from "../../application/loop/loop-data-compactor.js";
import { LoopRetentionPolicySchema } from "../../domain/loop/retention-policy.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerPruneCommands(program: Command): void {
  program
    .command("prune")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--yes", "persist pruned state", false)
    .option("--loop", "compact loop data per retention policy", false)
    .option("--hot-days <days>", "hot tier retention in days (default 30)")
    .option("--warm-days <days>", "warm tier retention in days (default 90)")
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);

      if (options.loop) {
        const policyInput: Record<string, unknown> = {};
        if (options.hotDays !== undefined) {
          policyInput.hotDays = parseInt(options.hotDays as string, 10);
        }
        if (options.warmDays !== undefined) {
          policyInput.warmDays = parseInt(options.warmDays as string, 10);
        }

        const parsed = LoopRetentionPolicySchema.safeParse(policyInput);
        if (!parsed.success) {
          console.error(`Invalid retention policy: ${parsed.error.message}`);
          process.exitCode = 1;
          return;
        }

        try {
          const result = await compactLoopData(workspaceRoot, parsed.data);

          if (options.json) {
            console.log(toJson(result));
            return;
          }

          const kbFreed = (result.bytesFreed / 1024).toFixed(1);
          console.log("Loop data compaction complete:");
          console.log(`  Traces compacted: ${result.tracesCompacted}`);
          console.log(`  Traces deleted:   ${result.tracesDeleted}`);
          console.log(`  Digests created:  ${result.digestsCreated}`);
          console.log(`  Freed:            ${kbFreed} KB`);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Unknown error";
          console.error(`Loop compaction failed: ${message}`);
          process.exitCode = 1;
        }
        return;
      }

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
