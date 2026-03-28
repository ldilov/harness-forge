import fs from "node:fs/promises";
import path from "node:path";

import type { RecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import type { RecursiveLanguageCapabilities } from "../../domain/recursive/language-capabilities.js";
import type { RecursiveSession } from "../../domain/recursive/session.js";
import type { RecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import type { RecursiveStructuredRun } from "../../domain/recursive/structured-run.js";
import type { RecursiveStructuredRunResult } from "../../domain/recursive/structured-run-result.js";
import { parseRecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import { parseRecursiveLanguageCapabilities } from "../../domain/recursive/language-capabilities.js";
import { parseRecursiveSession } from "../../domain/recursive/session.js";
import { parseRecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import { parseRecursiveStructuredRun } from "../../domain/recursive/structured-run.js";
import { parseRecursiveStructuredRunResult } from "../../domain/recursive/structured-run-result.js";
import {
  RUNTIME_DIR,
  RUNTIME_RECURSIVE_CAPABILITIES_FILE,
  RUNTIME_RECURSIVE_CALLS_FILE,
  RUNTIME_RECURSIVE_DIR,
  RUNTIME_RECURSIVE_EXECUTION_POLICY_FILE,
  RUNTIME_RECURSIVE_FINAL_OUTPUT_FILE,
  RUNTIME_RECURSIVE_LANGUAGE_CAPABILITIES_FILE,
  RUNTIME_RECURSIVE_MEMORY_FILE,
  RUNTIME_RECURSIVE_RUN_META_FILE,
  RUNTIME_RECURSIVE_RUN_RESULT_FILE,
  RUNTIME_RECURSIVE_RUNS_DIR,
  RUNTIME_RECURSIVE_SCRATCH_FILE,
  RUNTIME_RECURSIVE_SESSIONS_DIR,
  RUNTIME_RECURSIVE_SESSION_FILE,
  RUNTIME_RECURSIVE_SUMMARY_FILE,
  RUNTIME_RECURSIVE_TRACE_FILE,
  ensureDir,
  exists,
  readJsonFile,
  writeJsonFile
} from "../../shared/index.js";

export interface RecursiveWorkingMemoryRecord {
  sessionId: string;
  taskId?: string;
  currentObjective: string;
  currentPlan: string[];
  filesInFocus: string[];
  confirmedFacts: string[];
  inferredFacts: string[];
  blockers: string[];
  openQuestions: string[];
  recentFailedAttempts: string[];
  nextStep: string;
  lastUpdated: string;
}

export interface RecursiveScratchRecord {
  sessionId: string;
  updatedAt: string;
  notes: string[];
}

export interface RecursiveSessionBundle {
  session: RecursiveSession;
  executionPolicy?: RecursiveExecutionPolicy;
  capabilities?: RecursiveLanguageCapabilities;
  memory: RecursiveWorkingMemoryRecord;
  scratch: RecursiveScratchRecord;
  calls: Array<Record<string, unknown>>;
  summary: RecursiveSessionSummary;
  finalOutput?: Record<string, unknown>;
}

export interface RecursiveStructuredRunBundle {
  meta: RecursiveStructuredRun;
  result?: RecursiveStructuredRunResult;
}

function recursiveRuntimeRoot(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_RECURSIVE_DIR);
}

function recursiveSessionsRoot(workspaceRoot: string): string {
  return path.join(recursiveRuntimeRoot(workspaceRoot), RUNTIME_RECURSIVE_SESSIONS_DIR);
}

export function resolveRecursiveLanguageCapabilitiesPath(workspaceRoot: string): string {
  return path.join(recursiveRuntimeRoot(workspaceRoot), RUNTIME_RECURSIVE_LANGUAGE_CAPABILITIES_FILE);
}

export function resolveRecursiveSessionPaths(workspaceRoot: string, sessionId: string): {
  sessionsDir: string;
  sessionDir: string;
  sessionPath: string;
  executionPolicyPath: string;
  capabilitiesPath: string;
  memoryPath: string;
  scratchPath: string;
  callsPath: string;
  tracePath: string;
  summaryPath: string;
  finalOutputPath: string;
  runsDir: string;
} {
  const sessionsDir = recursiveSessionsRoot(workspaceRoot);
  const sessionDir = path.join(sessionsDir, sessionId);
  return {
    sessionsDir,
    sessionDir,
    sessionPath: path.join(sessionDir, RUNTIME_RECURSIVE_SESSION_FILE),
    executionPolicyPath: path.join(sessionDir, RUNTIME_RECURSIVE_EXECUTION_POLICY_FILE),
    capabilitiesPath: path.join(sessionDir, RUNTIME_RECURSIVE_CAPABILITIES_FILE),
    memoryPath: path.join(sessionDir, RUNTIME_RECURSIVE_MEMORY_FILE),
    scratchPath: path.join(sessionDir, RUNTIME_RECURSIVE_SCRATCH_FILE),
    callsPath: path.join(sessionDir, RUNTIME_RECURSIVE_CALLS_FILE),
    tracePath: path.join(sessionDir, RUNTIME_RECURSIVE_TRACE_FILE),
    summaryPath: path.join(sessionDir, RUNTIME_RECURSIVE_SUMMARY_FILE),
    finalOutputPath: path.join(sessionDir, RUNTIME_RECURSIVE_FINAL_OUTPUT_FILE),
    runsDir: path.join(sessionDir, RUNTIME_RECURSIVE_RUNS_DIR)
  };
}

export function resolveRecursiveRunPaths(
  workspaceRoot: string,
  sessionId: string,
  runId: string
): {
  runDir: string;
  metaPath: string;
  resultPath: string;
} {
  const sessionPaths = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  const runDir = path.join(sessionPaths.runsDir, runId);
  return {
    runDir,
    metaPath: path.join(runDir, RUNTIME_RECURSIVE_RUN_META_FILE),
    resultPath: path.join(runDir, RUNTIME_RECURSIVE_RUN_RESULT_FILE)
  };
}

export async function writeRecursiveSessionBundle(
  workspaceRoot: string,
  bundle: RecursiveSessionBundle
): Promise<ReturnType<typeof resolveRecursiveSessionPaths>> {
  const paths = resolveRecursiveSessionPaths(workspaceRoot, bundle.session.sessionId);
  await ensureDir(paths.sessionDir);
  await ensureDir(paths.runsDir);
  await Promise.all([
    writeJsonFile(paths.sessionPath, bundle.session),
    ...(bundle.executionPolicy ? [writeJsonFile(paths.executionPolicyPath, bundle.executionPolicy)] : []),
    ...(bundle.capabilities ? [writeJsonFile(paths.capabilitiesPath, bundle.capabilities)] : []),
    writeJsonFile(paths.memoryPath, bundle.memory),
    writeJsonFile(paths.scratchPath, bundle.scratch),
    writeJsonFile(paths.callsPath, bundle.calls),
    writeJsonFile(paths.summaryPath, bundle.summary),
    ...(bundle.finalOutput ? [writeJsonFile(paths.finalOutputPath, bundle.finalOutput)] : [])
  ]);
  return paths;
}

export async function writeRecursiveLanguageCapabilities(
  workspaceRoot: string,
  capabilities: RecursiveLanguageCapabilities
): Promise<string> {
  const capabilitiesPath = resolveRecursiveLanguageCapabilitiesPath(workspaceRoot);
  await ensureDir(path.dirname(capabilitiesPath));
  await writeJsonFile(capabilitiesPath, capabilities);
  return capabilitiesPath;
}

export async function loadRecursiveLanguageCapabilities(
  workspaceRoot: string
): Promise<RecursiveLanguageCapabilities | null> {
  const capabilitiesPath = resolveRecursiveLanguageCapabilitiesPath(workspaceRoot);
  if (!(await exists(capabilitiesPath))) {
    return null;
  }
  return parseRecursiveLanguageCapabilities(await readJsonFile<RecursiveLanguageCapabilities>(capabilitiesPath));
}

export async function loadRecursiveSession(workspaceRoot: string, sessionId: string): Promise<RecursiveSession | null> {
  const { sessionPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  if (!(await exists(sessionPath))) {
    return null;
  }
  return parseRecursiveSession(await readJsonFile<RecursiveSession>(sessionPath));
}

export async function loadRecursiveExecutionPolicy(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveExecutionPolicy | null> {
  const { executionPolicyPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  if (!(await exists(executionPolicyPath))) {
    return null;
  }
  return parseRecursiveExecutionPolicy(await readJsonFile<RecursiveExecutionPolicy>(executionPolicyPath));
}

export async function loadRecursiveSessionCapabilities(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveLanguageCapabilities | null> {
  const { capabilitiesPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  if (!(await exists(capabilitiesPath))) {
    return null;
  }
  return parseRecursiveLanguageCapabilities(await readJsonFile<RecursiveLanguageCapabilities>(capabilitiesPath));
}

export async function loadRecursiveSessionSummary(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveSessionSummary | null> {
  const { summaryPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  if (!(await exists(summaryPath))) {
    return null;
  }
  return parseRecursiveSessionSummary(await readJsonFile<RecursiveSessionSummary>(summaryPath));
}

export async function listRecursiveSessionIds(workspaceRoot: string): Promise<string[]> {
  const sessionsDir = recursiveSessionsRoot(workspaceRoot);
  if (!(await exists(sessionsDir))) {
    return [];
  }

  const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

export async function writeRecursiveStructuredRun(
  workspaceRoot: string,
  sessionId: string,
  bundle: RecursiveStructuredRunBundle
): Promise<ReturnType<typeof resolveRecursiveRunPaths>> {
  const paths = resolveRecursiveRunPaths(workspaceRoot, sessionId, bundle.meta.runId);
  await ensureDir(paths.runDir);
  await Promise.all([
    writeJsonFile(paths.metaPath, bundle.meta),
    ...(bundle.result ? [writeJsonFile(paths.resultPath, bundle.result)] : [])
  ]);
  return paths;
}

export async function listRecursiveRunIds(workspaceRoot: string, sessionId: string): Promise<string[]> {
  const { runsDir } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  if (!(await exists(runsDir))) {
    return [];
  }

  const entries = await fs.readdir(runsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

export async function listRecursiveStructuredRuns(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveStructuredRun[]> {
  const runIds = await listRecursiveRunIds(workspaceRoot, sessionId);
  const runs = await Promise.all(runIds.map((runId) => loadRecursiveStructuredRun(workspaceRoot, sessionId, runId)));
  return runs
    .filter((run): run is RecursiveStructuredRun => Boolean(run))
    .sort((left, right) => left.startedAt.localeCompare(right.startedAt));
}

export async function loadRecursiveStructuredRun(
  workspaceRoot: string,
  sessionId: string,
  runId: string
): Promise<RecursiveStructuredRun | null> {
  const { metaPath } = resolveRecursiveRunPaths(workspaceRoot, sessionId, runId);
  if (!(await exists(metaPath))) {
    return null;
  }
  return parseRecursiveStructuredRun(await readJsonFile<RecursiveStructuredRun>(metaPath));
}

export async function loadRecursiveStructuredRunResult(
  workspaceRoot: string,
  sessionId: string,
  runId: string
): Promise<RecursiveStructuredRunResult | null> {
  const { resultPath } = resolveRecursiveRunPaths(workspaceRoot, sessionId, runId);
  if (!(await exists(resultPath))) {
    return null;
  }
  return parseRecursiveStructuredRunResult(await readJsonFile<RecursiveStructuredRunResult>(resultPath));
}
