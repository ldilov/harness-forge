import path from "node:path";
import { Command } from "commander";

import { CompactionService } from "../../application/compaction/compaction-service.js";
import { EventReader } from "../../infrastructure/events/event-reader.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerCompactCommands(program: Command): void {
  program
    .command("compact")
    .description("Compact the event stream to reduce token usage and reclaim context budget.")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--level <level>", "compaction level: trim, summarize, rollup, rollover", "trim")
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const level = options.level as string;

      const validLevels = ["trim", "summarize", "rollup", "rollover"];
      if (!validLevels.includes(level)) {
        console.error(`Invalid compaction level: ${level}. Must be one of: ${validLevels.join(", ")}`);
        process.exitCode = 1;
        return;
      }

      const eventsPath = path.join(workspaceRoot, ".hforge/runtime/events");
      const reader = new EventReader(eventsPath);

      let events;
      try {
        events = await reader.readAll();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error reading events";
        console.error(`Failed to read events: ${message}`);
        process.exitCode = 1;
        return;
      }

      if (events.length === 0) {
        console.log("No events found. Nothing to compact.");
        return;
      }

      const service = new CompactionService(
        path.join(workspaceRoot, ".hforge/runtime/context"),
      );

      try {
        const manifest = await service.compact({
          level: level as "trim" | "summarize" | "rollup" | "rollover",
          events,
          objective: "CLI-initiated compaction",
          acceptedPlan: [],
          decisions: [],
          unresolved: [],
          artifacts: [],
        });

        if (options.json) {
          console.log(toJson(manifest));
          return;
        }

        const { stats, validation } = manifest;
        const savings = stats.estimatedTokensBefore > 0
          ? ((1 - stats.estimatedTokensAfter / stats.estimatedTokensBefore) * 100).toFixed(1)
          : "0.0";

        console.log(`Compaction complete (level: ${level})`);
        console.log(`  Tokens before: ${stats.estimatedTokensBefore}`);
        console.log(`  Tokens after:  ${stats.estimatedTokensAfter}`);
        console.log(`  Savings:       ${savings}%`);
        console.log(`  Dropped low:   ${stats.droppedLowImportanceItems}`);
        console.log(`  Summarized:    ${stats.summarizedMediumImportanceItems}`);
        console.log(`  Critical kept: ${stats.preservedCriticalItems}`);
        console.log(`  Validation:    ${validation.passed ? "passed" : "FAILED"}`);
        if (!validation.passed) {
          console.log(`  Checks:        ${validation.checks.join(", ")}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown compaction error";
        console.error(`Compaction failed: ${message}`);
        process.exitCode = 1;
      }
    });
}
