import path from "node:path";

export const SENTINEL_MONITORS_DIR = ".hforge/monitors";
export const SENTINEL_RUNTIME_DIR = ".hforge/runtime";
export const SENTINEL_OBSERVATIONS_DIR = path.join(SENTINEL_RUNTIME_DIR, "observations");
export const SENTINEL_OBSERVATIONS_FILE = "observations.jsonl";
export const SENTINEL_FINGERPRINTS_FILE = "fingerprints.json";
export const SENTINEL_MONITOR_RUNS_FILE = "monitor-runs.jsonl";
export const SENTINEL_SIGNALS_DIR = path.join(SENTINEL_RUNTIME_DIR, "signals");
export const SENTINEL_SIGNALS_FILE = "signals.jsonl";
export const SENTINEL_SUPPRESSIONS_FILE = "suppressions.json";
export const SENTINEL_SIGNALS_INDEX_FILE = "signals-index.json";
export const SENTINEL_ACTIONS_DIR = path.join(SENTINEL_RUNTIME_DIR, "actions");
export const SENTINEL_ACTIONS_QUEUE_FILE = "queue.json";
export const SENTINEL_LEDGER_FILE = "ledger.jsonl";
export const SENTINEL_POLICIES_DIR = path.join(SENTINEL_RUNTIME_DIR, "policies");
export const SENTINEL_CADENCE_FILE = "cadence.yaml";
export const SENTINEL_BUDGET_FILE = "budget.yaml";
export const SENTINEL_CADENCE_LEDGER_FILE = "cadence-ledger.jsonl";
export const SENTINEL_PID_FILE = path.join(SENTINEL_RUNTIME_DIR, "sentinel.pid");

export function sentinelObservationsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_OBSERVATIONS_DIR, SENTINEL_OBSERVATIONS_FILE);
}

export function sentinelFingerprintsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_OBSERVATIONS_DIR, SENTINEL_FINGERPRINTS_FILE);
}

export function sentinelMonitorRunsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_OBSERVATIONS_DIR, SENTINEL_MONITOR_RUNS_FILE);
}

export function sentinelMonitorsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_MONITORS_DIR);
}

export function sentinelCadencePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_POLICIES_DIR, SENTINEL_CADENCE_FILE);
}

export function sentinelBudgetPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_POLICIES_DIR, SENTINEL_BUDGET_FILE);
}

export function sentinelCadenceLedgerPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_RUNTIME_DIR, SENTINEL_CADENCE_LEDGER_FILE);
}

export function sentinelPidPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_PID_FILE);
}

export function sentinelSignalsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_SIGNALS_DIR, SENTINEL_SIGNALS_FILE);
}

export function sentinelSignalsIndexPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_SIGNALS_DIR, SENTINEL_SIGNALS_INDEX_FILE);
}

export function sentinelSuppressionsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_SIGNALS_DIR, SENTINEL_SUPPRESSIONS_FILE);
}

export function sentinelActionsQueuePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_ACTIONS_DIR, SENTINEL_ACTIONS_QUEUE_FILE);
}

export const SENTINEL_APPROVALS_FILE = "approvals.json";
export const SENTINEL_ACTIVE_PROFILE_FILE = "active-profile.json";
export const SENTINEL_DENIED_PATHS_FILE = "denied-paths.yaml";
export const SENTINEL_DENIED_COMMANDS_FILE = "denied-commands.yaml";

export function sentinelApprovalsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_ACTIONS_DIR, SENTINEL_APPROVALS_FILE);
}

export function sentinelActiveProfilePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_POLICIES_DIR, SENTINEL_ACTIVE_PROFILE_FILE);
}

export function sentinelDeniedPathsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_POLICIES_DIR, SENTINEL_DENIED_PATHS_FILE);
}

export function sentinelDeniedCommandsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_POLICIES_DIR, SENTINEL_DENIED_COMMANDS_FILE);
}

export const SENTINEL_RUNS_DIR = "runs";

export function sentinelRunDir(workspaceRoot: string, actionId: string): string {
  return path.join(workspaceRoot, SENTINEL_ACTIONS_DIR, SENTINEL_RUNS_DIR, actionId);
}

export function sentinelRunWorktreePath(workspaceRoot: string, actionId: string): string {
  return path.join(sentinelRunDir(workspaceRoot, actionId), "worktree");
}

export function sentinelRunStdoutPath(workspaceRoot: string, actionId: string, stepIndex: number): string {
  return path.join(sentinelRunDir(workspaceRoot, actionId), `stdout-step-${stepIndex}.log`);
}

export function sentinelRunStderrPath(workspaceRoot: string, actionId: string, stepIndex: number): string {
  return path.join(sentinelRunDir(workspaceRoot, actionId), `stderr-step-${stepIndex}.log`);
}

export function sentinelRunDiffPath(workspaceRoot: string, actionId: string): string {
  return path.join(sentinelRunDir(workspaceRoot, actionId), "patch.diff");
}

export function sentinelRunPlanPath(workspaceRoot: string, actionId: string): string {
  return path.join(sentinelRunDir(workspaceRoot, actionId), "plan.json");
}

export function sentinelRunVerificationPath(workspaceRoot: string, actionId: string): string {
  return path.join(sentinelRunDir(workspaceRoot, actionId), "verification.json");
}

export function sentinelRunSideEffectsPath(workspaceRoot: string, actionId: string): string {
  return path.join(sentinelRunDir(workspaceRoot, actionId), "side-effects.jsonl");
}

export function sentinelLedgerPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_ACTIONS_DIR, SENTINEL_LEDGER_FILE);
}

export const SENTINEL_WORLD_DIR = path.join(SENTINEL_RUNTIME_DIR, "world");
export const SENTINEL_WORLD_SOURCES_FILE = "sources.json";
export const SENTINEL_WORLD_CURSORS_FILE = "cursors.json";
export const SENTINEL_WORLD_CACHE_DIR = "cache";

export function sentinelWorldSourcesPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_WORLD_DIR, SENTINEL_WORLD_SOURCES_FILE);
}

export function sentinelWorldCursorsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_WORLD_DIR, SENTINEL_WORLD_CURSORS_FILE);
}

export function sentinelWorldCacheDir(workspaceRoot: string, source: string): string {
  return path.join(workspaceRoot, SENTINEL_WORLD_DIR, SENTINEL_WORLD_CACHE_DIR, source);
}

export function sentinelRunCheckpointPath(workspaceRoot: string, actionId: string): string {
  return path.join(sentinelRunDir(workspaceRoot, actionId), "checkpoint.json");
}

export const SENTINEL_WATCHDOG_DIR = path.join(SENTINEL_RUNTIME_DIR, "watchdog");
export const SENTINEL_WATCHDOG_INTERVENTIONS_FILE = "interventions.jsonl";
export const SENTINEL_WATCHDOG_RUNS_FILE = "agent-runs.json";

export function sentinelWatchdogInterventionsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_WATCHDOG_DIR, SENTINEL_WATCHDOG_INTERVENTIONS_FILE);
}

export function sentinelWatchdogRunsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, SENTINEL_WATCHDOG_DIR, SENTINEL_WATCHDOG_RUNS_FILE);
}
