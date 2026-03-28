import fs from "node:fs/promises";
import path from "node:path";

import type { RecursiveSession } from "../../domain/recursive/session.js";
import type { RecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import { parseRecursiveSession } from "../../domain/recursive/session.js";
import { parseRecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import {
  RUNTIME_DIR,
  RUNTIME_RECURSIVE_CALLS_FILE,
  RUNTIME_RECURSIVE_DIR,
  RUNTIME_RECURSIVE_FINAL_OUTPUT_FILE,
  RUNTIME_RECURSIVE_MEMORY_FILE,
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
  memory: RecursiveWorkingMemoryRecord;
  scratch: RecursiveScratchRecord;
  calls: Array<Record<string, unknown>>;
  summary: RecursiveSessionSummary;
  finalOutput?: Record<string, unknown>;
}

function recursiveSessionsRoot(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_RECURSIVE_DIR, RUNTIME_RECURSIVE_SESSIONS_DIR);
}

export function resolveRecursiveSessionPaths(workspaceRoot: string, sessionId: string): {
  sessionsDir: string;
  sessionDir: string;
  sessionPath: string;
  memoryPath: string;
  scratchPath: string;
  callsPath: string;
  tracePath: string;
  summaryPath: string;
  finalOutputPath: string;
} {
  const sessionsDir = recursiveSessionsRoot(workspaceRoot);
  const sessionDir = path.join(sessionsDir, sessionId);
  return {
    sessionsDir,
    sessionDir,
    sessionPath: path.join(sessionDir, RUNTIME_RECURSIVE_SESSION_FILE),
    memoryPath: path.join(sessionDir, RUNTIME_RECURSIVE_MEMORY_FILE),
    scratchPath: path.join(sessionDir, RUNTIME_RECURSIVE_SCRATCH_FILE),
    callsPath: path.join(sessionDir, RUNTIME_RECURSIVE_CALLS_FILE),
    tracePath: path.join(sessionDir, RUNTIME_RECURSIVE_TRACE_FILE),
    summaryPath: path.join(sessionDir, RUNTIME_RECURSIVE_SUMMARY_FILE),
    finalOutputPath: path.join(sessionDir, RUNTIME_RECURSIVE_FINAL_OUTPUT_FILE)
  };
}

export async function writeRecursiveSessionBundle(
  workspaceRoot: string,
  bundle: RecursiveSessionBundle
): Promise<ReturnType<typeof resolveRecursiveSessionPaths>> {
  const paths = resolveRecursiveSessionPaths(workspaceRoot, bundle.session.sessionId);
  await ensureDir(paths.sessionDir);
  await Promise.all([
    writeJsonFile(paths.sessionPath, bundle.session),
    writeJsonFile(paths.memoryPath, bundle.memory),
    writeJsonFile(paths.scratchPath, bundle.scratch),
    writeJsonFile(paths.callsPath, bundle.calls),
    writeJsonFile(paths.summaryPath, bundle.summary),
    ...(bundle.finalOutput ? [writeJsonFile(paths.finalOutputPath, bundle.finalOutput)] : [])
  ]);
  return paths;
}

export async function loadRecursiveSession(workspaceRoot: string, sessionId: string): Promise<RecursiveSession | null> {
  const { sessionPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  if (!(await exists(sessionPath))) {
    return null;
  }
  return parseRecursiveSession(await readJsonFile<RecursiveSession>(sessionPath));
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
