import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";

import { createDoctorReport } from "../../application/maintenance/doctor-workspace.js";
import { listStaleTaskAnalysisArtifacts } from "../../application/runtime/task-runtime-store.js";
import { loadDecisionIndex } from "../../application/runtime/decision-runtime-store.js";
import { loadInstallState } from "../../domain/state/install-state.js";
import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT, RUNTIME_DIR, RUNTIME_TASKS_DIR, exists } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

async function countTaskFolders(workspaceRoot: string): Promise<number> {
  const tasksRoot = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_TASKS_DIR);
  if (!(await exists(tasksRoot))) {
    return 0;
  }

  const entries = await fs.readdir(tasksRoot, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).length;
}

export function registerReviewCommands(program: Command): void {
  program
    .command("review")
    .description("Summarize runtime health, stale task artifacts, and decision coverage.")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const [state, doctor, staleTaskArtifacts, decisionIndex, taskCount] = await Promise.all([
        loadInstallState(workspaceRoot),
        createDoctorReport(workspaceRoot, PACKAGE_ROOT),
        listStaleTaskAnalysisArtifacts(workspaceRoot),
        loadDecisionIndex(workspaceRoot),
        countTaskFolders(workspaceRoot)
      ]);

      const result = {
        workspaceRoot,
        installedTargets: state?.installedTargets ?? [],
        installedBundles: state?.installedBundles ?? [],
        doctorStatus: doctor.status,
        taskCount,
        staleTaskArtifacts,
        decisionRecords: decisionIndex.entries.length
      };

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Workspace: ${workspaceRoot}`);
      console.log(`Doctor status: ${doctor.status}`);
      console.log(`Installed targets: ${result.installedTargets.join(", ") || "none"}`);
      console.log(`Task folders: ${taskCount}`);
      console.log(`Decision records: ${result.decisionRecords}`);
      console.log(`Stale task artifacts: ${staleTaskArtifacts.length}`);
    });
}
