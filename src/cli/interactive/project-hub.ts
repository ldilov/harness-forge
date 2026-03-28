import fs from "node:fs/promises";
import path from "node:path";

import { refreshWorkspaceRuntime } from "../../application/install/refresh-workspace-runtime.js";
import { createAuditReport } from "../../application/maintenance/audit-install.js";
import { createDoctorReport } from "../../application/maintenance/doctor-workspace.js";
import { loadDecisionIndex } from "../../application/runtime/decision-runtime-store.js";
import { listStaleTaskAnalysisArtifacts, resolveTaskArtifactPaths } from "../../application/runtime/task-runtime-store.js";
import { loadInstallState } from "../../domain/state/install-state.js";
import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT, RUNTIME_DIR, RUNTIME_INDEX_FILE, RUNTIME_TASKS_DIR, exists, readJsonFile } from "../../shared/index.js";
import { createPromptSession, readScriptLabel } from "./prompt-io.js";
import type { ExecutionSummary } from "./session-state.js";
import { detectTerminalCapabilities } from "./terminal-capabilities.js";
import { renderHubScreen } from "./renderers/hub-screen.js";

async function listTaskIds(workspaceRoot: string): Promise<string[]> {
  const tasksRoot = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_TASKS_DIR);
  if (!(await exists(tasksRoot))) {
    return [];
  }

  const entries = await fs.readdir(tasksRoot, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

export async function runProjectHub(workspaceRoot: string): Promise<ExecutionSummary> {
  const capabilities = detectTerminalCapabilities();
  const promptSession = createPromptSession(capabilities);
  const installState = await loadInstallState(workspaceRoot);
  const doctor = await createDoctorReport(workspaceRoot, PACKAGE_ROOT);
  const actions = [
    "status",
    "refresh",
    "task",
    "pack",
    "review",
    "export",
    "settings",
    "exit"
  ];

  console.log(renderHubScreen(workspaceRoot, actions, capabilities, `Runtime health: ${doctor.status}`));
  const action = await promptSession.askChoice(
    "hubAction",
    "Choose a project-hub action",
    [
      { value: "status", label: "Status", description: "Summarize install state and current runtime basics." },
      { value: "refresh", label: "Refresh", description: "Regenerate the shared runtime summary for the repo." },
      { value: "task", label: "Task", description: "Inspect task-runtime folders currently present under .hforge/runtime/tasks/." },
      { value: "pack", label: "Pack", description: "Inspect the canonical task pack for a task id." },
      { value: "review", label: "Review", description: "Check doctor status, stale artifacts, and decision coverage." },
      { value: "export", label: "Export", description: "Prepare a runtime handoff summary for review or sharing." },
      { value: "settings", label: "Settings", description: "Show current runtime visibility and setup profile details." },
      { value: "exit", label: "Exit", description: "Leave the interactive hub without changes." }
    ],
    doctor.status === "warning" ? "review" : "status"
  );

  switch (action) {
    case "refresh": {
      const result = await refreshWorkspaceRuntime(workspaceRoot);
      return {
        status: "success",
        workspaceRoot,
        appliedTargets: result.targetIds,
        writtenArtifacts: [result.runtimeIndexPath],
        preservedArtifacts: [],
        nextSuggestedCommands: [`hforge review --root ${workspaceRoot}`],
        importantPaths: [result.runtimeIndexPath],
        operatorMessage: `Refreshed shared runtime for ${workspaceRoot}.`
      };
    }
    case "task": {
      const taskIds = await listTaskIds(workspaceRoot);
      return {
        status: "success",
        workspaceRoot,
        appliedTargets: installState?.installedTargets ?? [],
        writtenArtifacts: [],
        preservedArtifacts: [],
        nextSuggestedCommands: [`hforge task list --root ${workspaceRoot} --json`],
        importantPaths: [path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_TASKS_DIR)],
        operatorMessage: `Task runtime folders: ${taskIds.join(", ") || "none"}.`
      };
    }
    case "pack": {
      const fallbackTaskId = (await listTaskIds(workspaceRoot))[0] ?? "TASK-001";
      const taskId = readScriptLabel("hubTaskId", fallbackTaskId);
      const taskPackPath = resolveTaskArtifactPaths(workspaceRoot, taskId).taskPackPath;
      const existsTaskPack = await exists(taskPackPath);
      return {
        status: existsTaskPack ? "success" : "failed",
        workspaceRoot,
        appliedTargets: installState?.installedTargets ?? [],
        writtenArtifacts: [],
        preservedArtifacts: [],
        nextSuggestedCommands: [`hforge pack inspect ${taskId} --root ${workspaceRoot} --json`],
        importantPaths: [taskPackPath],
        operatorMessage: existsTaskPack ? `Task pack is available for ${taskId}.` : `Task pack not found for ${taskId}.`
      };
    }
    case "review": {
      const [decisionIndex, staleArtifacts] = await Promise.all([
        loadDecisionIndex(workspaceRoot),
        listStaleTaskAnalysisArtifacts(workspaceRoot)
      ]);
      return {
        status: "success",
        workspaceRoot,
        appliedTargets: installState?.installedTargets ?? [],
        writtenArtifacts: [],
        preservedArtifacts: [],
        nextSuggestedCommands: [`hforge export --root ${workspaceRoot} --json`],
        importantPaths: [path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INDEX_FILE)],
        operatorMessage: `Doctor status: ${doctor.status}. Decision records: ${decisionIndex.entries.length}. Stale task artifacts: ${staleArtifacts.length}.`
      };
    }
    case "export": {
      const [audit, runtimeIndex] = await Promise.all([
        createAuditReport(workspaceRoot, PACKAGE_ROOT),
        readJsonFile<Record<string, unknown>>(path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INDEX_FILE)).catch(() => null)
      ]);
      return {
        status: "success",
        workspaceRoot,
        appliedTargets: installState?.installedTargets ?? [],
        writtenArtifacts: [],
        preservedArtifacts: [],
        nextSuggestedCommands: [`hforge export --root ${workspaceRoot} --json`],
        importantPaths: [path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INDEX_FILE)],
        operatorMessage: `Export-ready summary: ${audit.installedTargets.length} targets, ${audit.staleTaskArtifacts.length} stale task artifacts, runtime index ${runtimeIndex ? "present" : "missing"}.`
      };
    }
    case "settings": {
      return {
        status: "success",
        workspaceRoot,
        appliedTargets: installState?.installedTargets ?? [],
        writtenArtifacts: [],
        preservedArtifacts: [],
        nextSuggestedCommands: [`hforge status --root ${workspaceRoot}`],
        importantPaths: [path.join(workspaceRoot, ".hforge", "state", "install-state.json")],
        operatorMessage: `Visibility mode: ${installState?.visibilityMode ?? "unknown"}. Setup profile: ${installState?.setupProfile ?? "unknown"}.`
      };
    }
    case "exit":
      return {
        status: "cancelled",
        workspaceRoot,
        appliedTargets: installState?.installedTargets ?? [],
        writtenArtifacts: [],
        preservedArtifacts: [],
        nextSuggestedCommands: [],
        importantPaths: [],
        operatorMessage: "Exited the project hub without changes."
      };
    case "status":
    default:
      return {
        status: "success",
        workspaceRoot,
        appliedTargets: installState?.installedTargets ?? [],
        writtenArtifacts: [],
        preservedArtifacts: [],
        nextSuggestedCommands: [`hforge refresh --root ${workspaceRoot}`],
        importantPaths: [path.join(workspaceRoot, ".hforge", "state", "install-state.json")],
        operatorMessage: `Installed targets: ${(installState?.installedTargets ?? []).join(", ") || "none"}. Last action: ${installState?.lastAction ?? "unknown"}.`
      };
  }
}
