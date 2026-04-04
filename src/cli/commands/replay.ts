import path from "node:path";
import { Command } from "commander";

import { replayEvents } from "../../application/events/replay/event-replayer.js";
import { reconstructState } from "../../application/events/replay/state-reconstructor.js";
import { loadArchiveEvents } from "../../application/events/replay/archive-loader.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerReplayCommands(program: Command): void {
  program
    .command("replay")
    .description("Replay events from the runtime event stream with optional filtering and state reconstruction.")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--task <taskId>", "filter by task ID")
    .option("--correlation <correlationId>", "filter by correlation ID")
    .option("--category <category>", "filter by event category")
    .option("--importance <importance>", "filter by importance level")
    .option("--reconstruct", "reconstruct aggregated state from matched events", false)
    .option("--archive", "include events from cold archives", false)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);

      try {
        const result = await replayEvents(workspaceRoot, {
          taskId: options.task,
          correlationId: options.correlation,
          category: options.category,
          importance: options.importance,
        });

        let allEvents = [...result.events];
        let archiveCount = 0;

        if (options.archive) {
          const archiveEvents = await loadArchiveEvents(workspaceRoot);
          archiveCount = archiveEvents.length;
          allEvents = [...archiveEvents, ...allEvents];
        }

        const state = options.reconstruct
          ? reconstructState(allEvents)
          : undefined;

        if (options.json) {
          const output = {
            totalRead: result.totalRead + archiveCount,
            matchedCount: allEvents.length,
            archiveEventsLoaded: archiveCount,
            ...(state !== undefined ? { reconstructedState: state } : {}),
          };
          console.log(toJson(output));
          return;
        }

        console.log(`Events read:     ${result.totalRead + archiveCount}`);
        console.log(`Events matched:  ${allEvents.length}`);
        if (options.archive) {
          console.log(`Archive events:  ${archiveCount}`);
        }

        if (state !== undefined) {
          console.log("");
          console.log("Reconstructed state:");
          console.log(`  Event count:   ${state.eventCount}`);
          console.log(`  Categories:    ${state.categories.length > 0 ? state.categories.join(", ") : "none"}`);
          console.log(`  Task IDs:      ${state.taskIds.length > 0 ? state.taskIds.join(", ") : "none"}`);
          if (state.timeRange !== null) {
            console.log(`  First event:   ${state.timeRange.first}`);
            console.log(`  Last event:    ${state.timeRange.last}`);
          }
          console.log(`  Importance:    ${Object.entries(state.importanceCounts).map(([k, v]) => `${k}=${v}`).join(", ") || "none"}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error during replay";
        console.error(`Replay failed: ${message}`);
        process.exitCode = 1;
      }
    });
}
