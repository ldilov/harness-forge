import * as fs from "node:fs";
import * as path from "node:path";
import type { WorkspaceState } from "../../domain/next/candidate-action.js";

export interface CollectWorkspaceStateInput {
  readonly workspaceRoot: string;
}

export async function collectWorkspaceState(
  input: CollectWorkspaceStateInput
): Promise<WorkspaceState> {
  const { workspaceRoot } = input;

  const hasInstallState = fileOrDirExists(workspaceRoot, ".hforge/state");
  const runtimeIndexPath = path.join(workspaceRoot, ".hforge", "runtime", "index.json");
  const hasRuntimeIndex = safeFileExists(runtimeIndexPath);

  let isRuntimeStale = false;
  if (hasRuntimeIndex) {
    try {
      const stat = fs.statSync(runtimeIndexPath);
      const ageMs = Date.now() - stat.mtimeMs;
      const oneHourMs = 60 * 60 * 1000;
      isRuntimeStale = ageMs > oneHourMs;
    } catch {
      isRuntimeStale = true;
    }
  }

  const doctorStatus = detectDoctorStatus(workspaceRoot);
  const staleArtifactCount = countStaleArtifacts(workspaceRoot);
  const hasTaskFolders = fileOrDirExists(workspaceRoot, ".hforge/runtime/tasks");
  const hasPacksAvailable = fileOrDirExists(workspaceRoot, ".hforge/runtime/packs");
  const hasFlowState = fileOrDirExists(workspaceRoot, ".hforge/state/flow");
  const isShellIntegrated = true; // Assume true if running in CLI context
  const detectedTargets = detectTargets(workspaceRoot);

  return {
    hasInstallState,
    hasRuntimeIndex,
    isRuntimeStale,
    doctorStatus,
    staleArtifactCount,
    hasTaskFolders,
    hasPacksAvailable,
    hasFlowState,
    isShellIntegrated,
    detectedTargets,
  };
}

function fileOrDirExists(root: string, relative: string): boolean {
  try {
    fs.statSync(path.join(root, relative));
    return true;
  } catch {
    return false;
  }
}

function safeFileExists(fullPath: string): boolean {
  try {
    return fs.statSync(fullPath).isFile();
  } catch {
    return false;
  }
}

function detectDoctorStatus(root: string): WorkspaceState["doctorStatus"] {
  const doctorPath = path.join(root, ".hforge", "state", "doctor-report.json");
  try {
    const report = JSON.parse(fs.readFileSync(doctorPath, "utf-8"));
    if (report.status === "healthy") return "healthy";
    if (report.status === "warning") return "warning";
    if (report.status === "failure") return "failure";
    return "unknown";
  } catch {
    return "unknown";
  }
}

function countStaleArtifacts(root: string): number {
  const tasksDir = path.join(root, ".hforge", "runtime", "tasks");
  try {
    const entries = fs.readdirSync(tasksDir);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    let count = 0;
    for (const entry of entries) {
      try {
        const stat = fs.statSync(path.join(tasksDir, entry));
        if (stat.mtimeMs < oneHourAgo) count++;
      } catch { /* skip */ }
    }
    return count;
  } catch {
    return 0;
  }
}

function detectTargets(root: string): string[] {
  const targets: string[] = [];
  if (fileOrDirExists(root, ".codex")) targets.push("codex");
  if (fileOrDirExists(root, ".claude")) targets.push("claude-code");
  return targets;
}
