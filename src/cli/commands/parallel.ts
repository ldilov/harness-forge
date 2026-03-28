import path from "node:path";
import { Command } from "commander";

import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { runNodeScript } from "./script-runner.js";

export function registerParallelCommands(program: Command): void {
  const parallel = program.command("parallel").description("Parallel worktree planning and merge-readiness helpers.");

  parallel
    .command("plan")
    .argument("[tasksFile]", "tasks.md file to analyze", "specs/004-enhancement-pack-foundations/tasks.md")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((tasksFile: string, options) => {
      const workspaceRoot = path.resolve(options.root);
      const resolvedTasksFile = path.resolve(workspaceRoot, tasksFile);
      const args = [resolvedTasksFile];
      if (options.json) {
        args.push("--json");
      }
      runNodeScript("scripts/runtime/create-parallel-plan.mjs", workspaceRoot, args);
    });

  parallel
    .command("status")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((options) => {
      const workspaceRoot = path.resolve(options.root);
      const args: string[] = [];
      if (options.json) {
        args.push("--json");
      }
      runNodeScript("scripts/runtime/check-parallel-status.mjs", workspaceRoot, args);
    });

  parallel
    .command("merge-check")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((options) => {
      const workspaceRoot = path.resolve(options.root);
      const args: string[] = [];
      if (options.json) {
        args.push("--json");
      }
      runNodeScript("scripts/runtime/check-merge-readiness.mjs", workspaceRoot, args);
    });
}
