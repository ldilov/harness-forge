import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";

import { resolveTaskArtifactPaths } from "../../application/runtime/task-runtime-store.js";
import { DEFAULT_WORKSPACE_ROOT, RUNTIME_DIR, RUNTIME_TASKS_DIR, ValidationError, exists, readJsonFile } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

async function listTasks(workspaceRoot: string) {
  const tasksRoot = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_TASKS_DIR);
  if (!(await exists(tasksRoot))) {
    return [];
  }

  const entries = await fs.readdir(tasksRoot, { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const paths = resolveTaskArtifactPaths(workspaceRoot, entry.name);
        return {
          taskId: entry.name,
          fileInterest: await exists(paths.fileInterestPath),
          impactAnalysis: await exists(paths.impactAnalysisPath),
          taskPack: await exists(paths.taskPackPath),
          recursiveLink: await exists(paths.recursiveSessionLinkPath)
        };
      })
  );
}

export function registerTaskCommands(program: Command): void {
  const task = program.command("task").description("Inspect task-runtime artifacts in the hidden .hforge layer.");

  task
    .command("list")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = { workspaceRoot, tasks: await listTasks(workspaceRoot) };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  task
    .command("inspect <taskId>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (taskId, options) => {
      const workspaceRoot = path.resolve(options.root);
      const paths = resolveTaskArtifactPaths(workspaceRoot, taskId);
      if (!(await exists(paths.taskDir))) {
        throw new ValidationError(`Task runtime folder not found for ${taskId}. Expected ${paths.taskDir}.`);
      }

      const result = {
        taskId,
        workspaceRoot,
        fileInterest: (await exists(paths.fileInterestPath)) ? await readJsonFile(paths.fileInterestPath) : null,
        impactAnalysis: (await exists(paths.impactAnalysisPath)) ? await readJsonFile(paths.impactAnalysisPath) : null,
        taskPack: (await exists(paths.taskPackPath)) ? await readJsonFile(paths.taskPackPath) : null,
        recursiveLink: (await exists(paths.recursiveSessionLinkPath)) ? await readJsonFile(paths.recursiveSessionLinkPath) : null
      };

      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
