import path from "node:path";
import { Command } from "commander";

import { resolveTaskArtifactPaths } from "../../application/runtime/task-runtime-store.js";
import { DEFAULT_WORKSPACE_ROOT, ValidationError, exists, readJsonFile } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerPackCommands(program: Command): void {
  const pack = program.command("pack").description("Inspect canonical task-pack artifacts.");

  pack
    .command("inspect <taskId>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (taskId, options) => {
      const workspaceRoot = path.resolve(options.root);
      const paths = resolveTaskArtifactPaths(workspaceRoot, taskId);
      if (!(await exists(paths.taskPackPath))) {
        throw new ValidationError(`Task pack not found for ${taskId}. Expected ${paths.taskPackPath}.`);
      }

      const result = {
        taskId,
        taskPackPath: paths.taskPackPath,
        taskPack: await readJsonFile(paths.taskPackPath)
      };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
