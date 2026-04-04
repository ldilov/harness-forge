import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";

import { summarizeRuntimeReview } from "../../application/runtime/review-workspace.js";
import { writeRuntimeAuditArtifact } from "../../application/runtime/write-runtime-audit-artifact.js";
import { createDoctorReport } from "../../application/maintenance/doctor-workspace.js";
import { listStaleTaskAnalysisArtifacts } from "../../application/runtime/task-runtime-store.js";
import { listRecursiveSessionIds } from "../../infrastructure/recursive/session-store.js";
import { loadDecisionIndex } from "../../application/runtime/decision-runtime-store.js";
import { loadInstallState } from "../../domain/state/install-state.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
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
    .option("--profile <profile>", "output profile: brief|standard|deep", "standard")
    .option("--delta-only", "show only changed findings", false)
    .option("--summary-only", "emit verdict and counts only", false)
    .option("--max-findings <n>", "limit reported findings", parseInt)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const [state, doctor, staleTaskArtifacts, decisionIndex, taskCount, recursiveSessions] = await Promise.all([
        loadInstallState(workspaceRoot),
        createDoctorReport(workspaceRoot, PACKAGE_ROOT),
        listStaleTaskAnalysisArtifacts(workspaceRoot),
        loadDecisionIndex(workspaceRoot),
        countTaskFolders(workspaceRoot),
        listRecursiveSessionIds(workspaceRoot)
      ]);

      const findings = [
        {
          id: "doctor-status",
          title: `Doctor status: ${doctor.status}`,
          severity: doctor.status === "warning" ? "high" : "low",
          evidence: [".hforge/runtime/index.json"]
        },
        {
          id: "stale-task-artifacts",
          title: `Stale task artifacts: ${staleTaskArtifacts.length}`,
          severity: staleTaskArtifacts.length > 0 ? "medium" : "low",
          evidence: staleTaskArtifacts.slice(0, 3).map((entry) => JSON.stringify(entry))
        }
      ];

      const maxFindings = options.maxFindings ?? (options.profile === "brief" ? 3 : options.profile === "deep" ? 15 : 7);
      const limitedFindings = findings.slice(0, maxFindings);

      const summary = summarizeRuntimeReview(limitedFindings);
      const artifactPath = await writeRuntimeAuditArtifact(workspaceRoot, `review-${Date.now()}`, {
        ...summary,
        profile: options.profile
      });

      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "review-run",
        subjectId: "review",
        result: "success",
        recordedAt: new Date().toISOString(),
        details: { doctorStatus: doctor.status, findingsCount: limitedFindings.length },
        category: "runtimeUsage",
        confidenceLevel: "direct"
      });

      const result = {
        workspaceRoot,
        profile: options.profile,
        deltaOnly: options.deltaOnly,
        summaryOnly: options.summaryOnly,
        installedTargets: state?.installedTargets ?? [],
        installedBundles: state?.installedBundles ?? [],
        doctorStatus: doctor.status,
        taskCount,
        staleTaskArtifacts,
        decisionRecords: decisionIndex.entries.length,
        recursiveSessions,
        summary,
        artifactPath
      };

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Workspace: ${workspaceRoot}`);
      console.log(`Profile: ${options.profile}`);
      console.log(`Delta mode: ${options.deltaOnly ? "enabled" : "disabled"}`);
      console.log(`Doctor status: ${doctor.status}`);
      console.log(`Installed targets: ${result.installedTargets.join(", ") || "none"}`);
      console.log(`Task folders: ${taskCount}`);
      console.log(`Decision records: ${result.decisionRecords}`);
      console.log(`Stale task artifacts: ${staleTaskArtifacts.length}`);
      console.log(`Recursive sessions: ${result.recursiveSessions.length}`);
      console.log(`Audit artifact: ${artifactPath}`);
    });
}
