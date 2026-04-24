import fs from "node:fs/promises";
import path from "node:path";
import { Command } from "commander";

import { summarizeRuntimeReview } from "../../application/runtime/review-workspace.js";
import { writeRuntimeAuditArtifact } from "../../application/runtime/write-runtime-audit-artifact.js";
import { createDoctorReport } from "../../application/maintenance/doctor-workspace.js";
import { listStaleTaskAnalysisArtifacts, listTaskPacks } from "../../application/runtime/task-runtime-store.js";
import { listRecursiveSessionIds } from "../../infrastructure/recursive/session-store.js";
import { loadDecisionIndex, loadDecisionRecords } from "../../application/runtime/decision-runtime-store.js";
import { deriveDecisionHealth } from "../../application/runtime/derive-decision-health.js";
import { evaluateDecisionCoverage } from "../../application/runtime/evaluate-decision-coverage.js";
import { buildDecisionChains } from "../../application/runtime/build-decision-chain.js";
import { buildArchitectureChangeFeed } from "../../application/runtime/build-architecture-change-feed.js";
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

function countByStatus(entries: Array<{ status: string }>): Record<string, number> {
  return entries.reduce<Record<string, number>>((counts, entry) => {
    counts[entry.status] = (counts[entry.status] ?? 0) + 1;
    return counts;
  }, {});
}

function newestDecisionAgeDays(entries: Array<{ createdAt?: string }>, now = new Date()): number | null {
  const newest = entries
    .map((entry) => (entry.createdAt ? Date.parse(entry.createdAt) : Number.NaN))
    .filter((time) => !Number.isNaN(time))
    .sort((left, right) => right - left)[0];
  return newest === undefined ? null : Math.floor((now.getTime() - newest) / 86_400_000);
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
      const [state, doctor, staleTaskArtifacts, decisionIndex, decisionRecords, taskPacks, taskCount, recursiveSessions] = await Promise.all([
        loadInstallState(workspaceRoot),
        createDoctorReport(workspaceRoot, PACKAGE_ROOT),
        listStaleTaskAnalysisArtifacts(workspaceRoot),
        loadDecisionIndex(workspaceRoot),
        loadDecisionRecords(workspaceRoot),
        listTaskPacks(workspaceRoot),
        countTaskFolders(workspaceRoot),
        listRecursiveSessionIds(workspaceRoot)
      ]);

      const decisionCoverageResults = evaluateDecisionCoverage(taskPacks, decisionRecords);
      const decisionHealthFindings = deriveDecisionHealth({
        decisions: decisionRecords,
        taskPacks,
        coverageResults: decisionCoverageResults
      });
      const decisionChains = buildDecisionChains(decisionRecords);
      const architectureChangeFeed = buildArchitectureChangeFeed({
        decisions: decisionRecords,
        taskPacks,
        healthFindings: decisionHealthFindings,
        coverageResults: decisionCoverageResults
      });
      const decisionStatusCounts = countByStatus(decisionIndex.entries);
      const decisionHealthSummary = {
        total: decisionHealthFindings.length,
        bySeverity: decisionHealthFindings.reduce<Record<string, number>>((counts, finding) => {
          counts[finding.severity] = (counts[finding.severity] ?? 0) + 1;
          return counts;
        }, {}),
        byCategory: decisionHealthFindings.reduce<Record<string, number>>((counts, finding) => {
          counts[finding.category] = (counts[finding.category] ?? 0) + 1;
          return counts;
        }, {})
      };
      const decisionCoverageSummary = {
        total: decisionCoverageResults.length,
        byClassification: decisionCoverageResults.reduce<Record<string, number>>((counts, result) => {
          counts[result.classification] = (counts[result.classification] ?? 0) + 1;
          return counts;
        }, {}),
        blockers: decisionCoverageResults.filter((result) => result.severity === "blocker").length,
        warnings: decisionCoverageResults.filter((result) => result.severity === "warning").length
      };
      const architectureFeedSummary = {
        total: architectureChangeFeed.length,
        byEventType: architectureChangeFeed.reduce<Record<string, number>>((counts, entry) => {
          counts[entry.eventType] = (counts[entry.eventType] ?? 0) + 1;
          return counts;
        }, {})
      };

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
        },
        ...decisionHealthFindings.map((finding) => ({
          id: finding.id,
          title: finding.title,
          severity: finding.severity === "blocker" ? "high" : finding.severity === "warning" ? "medium" : "low",
          evidence: finding.evidence
        }))
      ];

      const maxFindings = options.maxFindings ?? (options.profile === "brief" ? 3 : options.profile === "deep" ? 15 : 7);
      const limitedFindings = findings.slice(0, maxFindings);

      const summary = summarizeRuntimeReview(limitedFindings);
      const artifactPath = await writeRuntimeAuditArtifact(workspaceRoot, `review-${Date.now()}`, {
        ...summary,
        profile: options.profile,
        decisionHealthSummary,
        decisionCoverageSummary,
        architectureFeedSummary
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
        decisionStatusCounts,
        newestDecisionAgeDays: newestDecisionAgeDays(decisionIndex.entries),
        decisionHealthSummary,
        decisionHealthFindings,
        decisionChains,
        decisionCoverageSummary,
        decisionCoverageResults,
        architectureFeedSummary,
        architectureChangeFeed,
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
