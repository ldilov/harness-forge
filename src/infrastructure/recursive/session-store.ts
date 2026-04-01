import fs from "node:fs/promises";
import path from "node:path";

import type { RecursiveActionBundle } from "../../domain/recursive/action-bundle.js";
import type { RecursiveCheckpoint } from "../../domain/recursive/checkpoint.js";
import type { RecursiveCodeCell, RecursiveCodeCellResult } from "../../domain/recursive/code-cell.js";
import type { RecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import type { RecursiveFinalOutput } from "../../domain/recursive/final-output.js";
import type { RecursiveIteration, RecursiveRootExecutionFrame } from "../../domain/recursive/iteration.js";
import type { RecursiveLanguageCapabilities } from "../../domain/recursive/language-capabilities.js";
import type { RecursiveWorkingMemory, RecursiveScratchRecord } from "../../domain/recursive/memory.js";
import type { RecursiveMetaOpProposal } from "../../domain/recursive/meta-op-proposal.js";
import type { RecursivePromotionProposal } from "../../domain/recursive/promotion-proposal.js";
import type { RecursiveTrajectoryScorecard } from "../../domain/recursive/scorecard.js";
import type { RecursiveSession } from "../../domain/recursive/session.js";
import type { RecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import type { RecursiveStructuredRunResult } from "../../domain/recursive/structured-run-result.js";
import type { RecursiveStructuredRun } from "../../domain/recursive/structured-run.js";
import type { RecursiveSubcall } from "../../domain/recursive/subcall.js";
import { parseRecursiveActionBundle } from "../../domain/recursive/action-bundle.js";
import { parseRecursiveCheckpoint } from "../../domain/recursive/checkpoint.js";
import { parseRecursiveCodeCell, parseRecursiveCodeCellResult } from "../../domain/recursive/code-cell.js";
import { parseRecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import { parseRecursiveFinalOutput } from "../../domain/recursive/final-output.js";
import { parseRecursiveIteration, parseRecursiveRootExecutionFrame } from "../../domain/recursive/iteration.js";
import { parseRecursiveLanguageCapabilities } from "../../domain/recursive/language-capabilities.js";
import { parseRecursiveWorkingMemory, parseRecursiveScratchRecord } from "../../domain/recursive/memory.js";
import { parseRecursiveMetaOpProposal } from "../../domain/recursive/meta-op-proposal.js";
import { parseRecursivePromotionProposal } from "../../domain/recursive/promotion-proposal.js";
import { parseRecursiveTrajectoryScorecard } from "../../domain/recursive/scorecard.js";
import { parseRecursiveSession } from "../../domain/recursive/session.js";
import { parseRecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import { parseRecursiveStructuredRunResult } from "../../domain/recursive/structured-run-result.js";
import { parseRecursiveStructuredRun } from "../../domain/recursive/structured-run.js";
import { parseRecursiveSubcall } from "../../domain/recursive/subcall.js";
import {
  RUNTIME_DIR,
  RUNTIME_RECURSIVE_CAPABILITIES_FILE,
  RUNTIME_RECURSIVE_CALLS_FILE,
  RUNTIME_RECURSIVE_CHECKPOINTS_DIR,
  RUNTIME_RECURSIVE_CODE_CELLS_DIR,
  RUNTIME_RECURSIVE_CODE_CELL_FILE,
  RUNTIME_RECURSIVE_CODE_CELL_RESULT_FILE,
  RUNTIME_RECURSIVE_CODE_CELL_SOURCE_FILE,
  RUNTIME_RECURSIVE_CODE_CELL_STDERR_FILE,
  RUNTIME_RECURSIVE_CODE_CELL_STDOUT_FILE,
  RUNTIME_RECURSIVE_DIR,
  RUNTIME_RECURSIVE_EXECUTION_POLICY_FILE,
  RUNTIME_RECURSIVE_FINAL_OUTPUT_FILE,
  RUNTIME_RECURSIVE_HANDLE_INVENTORY_FILE,
  RUNTIME_RECURSIVE_ITERATIONS_DIR,
  RUNTIME_RECURSIVE_ITERATION_BUNDLE_FILE,
  RUNTIME_RECURSIVE_ITERATION_FILE,
  RUNTIME_RECURSIVE_ITERATION_FRAME_FILE,
  RUNTIME_RECURSIVE_LANGUAGE_CAPABILITIES_FILE,
  RUNTIME_RECURSIVE_MEMORY_FILE,
  RUNTIME_RECURSIVE_META_OPS_DIR,
  RUNTIME_RECURSIVE_PROMOTIONS_DIR,
  RUNTIME_RECURSIVE_ROOT_FRAME_FILE,
  RUNTIME_RECURSIVE_RUN_META_FILE,
  RUNTIME_RECURSIVE_RUN_RESULT_FILE,
  RUNTIME_RECURSIVE_RUNS_DIR,
  RUNTIME_RECURSIVE_SCORECARDS_DIR,
  RUNTIME_RECURSIVE_SCORECARD_FILE,
  RUNTIME_RECURSIVE_SCRATCH_FILE,
  RUNTIME_RECURSIVE_SESSIONS_DIR,
  RUNTIME_RECURSIVE_SESSION_FILE,
  RUNTIME_RECURSIVE_SUBCALLS_DIR,
  RUNTIME_RECURSIVE_SUMMARY_FILE,
  RUNTIME_RECURSIVE_TRACE_FILE,
  ensureDir,
  exists,
  readJsonFile,
  readTextFile,
  writeJsonFile,
  writeTextFile
} from "../../shared/index.js";

export interface RecursiveSessionBundle {
  session: RecursiveSession;
  executionPolicy?: RecursiveExecutionPolicy;
  capabilities?: RecursiveLanguageCapabilities;
  memory: RecursiveWorkingMemory;
  scratch: RecursiveScratchRecord;
  calls: Array<Record<string, unknown>>;
  summary: RecursiveSessionSummary;
  finalOutput?: RecursiveFinalOutput;
  rootFrame?: RecursiveRootExecutionFrame;
  handleInventory?: RecursiveSession["handles"];
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

function toPortablePath(workspaceRoot: string, targetPath: string): string {
  return (path.relative(workspaceRoot, targetPath) || targetPath).replaceAll("\\", "/");
}

async function listDirNames(dirPath: string): Promise<string[]> {
  if (!(await exists(dirPath))) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() || entry.isFile())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function loadIfExists<T>(filePath: string, parse: (value: unknown) => T): Promise<T | null> {
  if (!(await exists(filePath))) {
    return null;
  }
  return parse(await readJsonFile<T>(filePath));
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
  rootFramePath: string;
  handleInventoryPath: string;
  runsDir: string;
  iterationsDir: string;
  subcallsDir: string;
  codeCellsDir: string;
  checkpointsDir: string;
  promotionsDir: string;
  metaOpsDir: string;
  scorecardsDir: string;
  latestScorecardPath: string;
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
    rootFramePath: path.join(sessionDir, RUNTIME_RECURSIVE_ROOT_FRAME_FILE),
    handleInventoryPath: path.join(sessionDir, RUNTIME_RECURSIVE_HANDLE_INVENTORY_FILE),
    runsDir: path.join(sessionDir, RUNTIME_RECURSIVE_RUNS_DIR),
    iterationsDir: path.join(sessionDir, RUNTIME_RECURSIVE_ITERATIONS_DIR),
    subcallsDir: path.join(sessionDir, RUNTIME_RECURSIVE_SUBCALLS_DIR),
    codeCellsDir: path.join(sessionDir, RUNTIME_RECURSIVE_CODE_CELLS_DIR),
    checkpointsDir: path.join(sessionDir, RUNTIME_RECURSIVE_CHECKPOINTS_DIR),
    promotionsDir: path.join(sessionDir, RUNTIME_RECURSIVE_PROMOTIONS_DIR),
    metaOpsDir: path.join(sessionDir, RUNTIME_RECURSIVE_META_OPS_DIR),
    scorecardsDir: path.join(sessionDir, RUNTIME_RECURSIVE_SCORECARDS_DIR),
    latestScorecardPath: path.join(sessionDir, RUNTIME_RECURSIVE_SCORECARDS_DIR, RUNTIME_RECURSIVE_SCORECARD_FILE)
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

export function resolveRecursiveIterationPaths(
  workspaceRoot: string,
  sessionId: string,
  iterationId: string
): {
  iterationDir: string;
  iterationPath: string;
  framePath: string;
  bundlePath: string;
} {
  const sessionPaths = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  const iterationDir = path.join(sessionPaths.iterationsDir, iterationId);
  return {
    iterationDir,
    iterationPath: path.join(iterationDir, RUNTIME_RECURSIVE_ITERATION_FILE),
    framePath: path.join(iterationDir, RUNTIME_RECURSIVE_ITERATION_FRAME_FILE),
    bundlePath: path.join(iterationDir, RUNTIME_RECURSIVE_ITERATION_BUNDLE_FILE)
  };
}

export function resolveRecursiveSubcallPath(workspaceRoot: string, sessionId: string, subcallId: string): string {
  return path.join(resolveRecursiveSessionPaths(workspaceRoot, sessionId).subcallsDir, `${subcallId}.json`);
}

export function resolveRecursiveCheckpointPath(workspaceRoot: string, sessionId: string, checkpointId: string): string {
  return path.join(resolveRecursiveSessionPaths(workspaceRoot, sessionId).checkpointsDir, `${checkpointId}.json`);
}

export function resolveRecursivePromotionPath(workspaceRoot: string, sessionId: string, promotionId: string): string {
  return path.join(resolveRecursiveSessionPaths(workspaceRoot, sessionId).promotionsDir, `${promotionId}.json`);
}

export function resolveRecursiveMetaOpPath(workspaceRoot: string, sessionId: string, metaOpId: string): string {
  return path.join(resolveRecursiveSessionPaths(workspaceRoot, sessionId).metaOpsDir, `${metaOpId}.json`);
}

export function resolveRecursiveScorecardPath(workspaceRoot: string, sessionId: string, scorecardId: string): string {
  return path.join(resolveRecursiveSessionPaths(workspaceRoot, sessionId).scorecardsDir, `${scorecardId}.json`);
}

export function resolveRecursiveCodeCellPaths(
  workspaceRoot: string,
  sessionId: string,
  cellId: string
): {
  cellDir: string;
  cellPath: string;
  resultPath: string;
  sourcePath: string;
  stdoutPath: string;
  stderrPath: string;
} {
  const sessionPaths = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  const cellDir = path.join(sessionPaths.codeCellsDir, cellId);
  return {
    cellDir,
    cellPath: path.join(cellDir, RUNTIME_RECURSIVE_CODE_CELL_FILE),
    resultPath: path.join(cellDir, RUNTIME_RECURSIVE_CODE_CELL_RESULT_FILE),
    sourcePath: path.join(cellDir, RUNTIME_RECURSIVE_CODE_CELL_SOURCE_FILE),
    stdoutPath: path.join(cellDir, RUNTIME_RECURSIVE_CODE_CELL_STDOUT_FILE),
    stderrPath: path.join(cellDir, RUNTIME_RECURSIVE_CODE_CELL_STDERR_FILE)
  };
}

export async function writeRecursiveSessionBundle(
  workspaceRoot: string,
  bundle: RecursiveSessionBundle
): Promise<ReturnType<typeof resolveRecursiveSessionPaths>> {
  const paths = resolveRecursiveSessionPaths(workspaceRoot, bundle.session.sessionId);
  await Promise.all([
    ensureDir(paths.sessionDir),
    ensureDir(paths.runsDir),
    ensureDir(paths.iterationsDir),
    ensureDir(paths.subcallsDir),
    ensureDir(paths.codeCellsDir),
    ensureDir(paths.checkpointsDir),
    ensureDir(paths.promotionsDir),
    ensureDir(paths.metaOpsDir),
    ensureDir(paths.scorecardsDir)
  ]);
  await Promise.all([
    writeJsonFile(paths.sessionPath, bundle.session),
    ...(bundle.executionPolicy ? [writeJsonFile(paths.executionPolicyPath, bundle.executionPolicy)] : []),
    ...(bundle.capabilities ? [writeJsonFile(paths.capabilitiesPath, bundle.capabilities)] : []),
    writeJsonFile(paths.memoryPath, bundle.memory),
    writeJsonFile(paths.scratchPath, bundle.scratch),
    writeJsonFile(paths.callsPath, bundle.calls),
    writeJsonFile(paths.summaryPath, bundle.summary),
    writeJsonFile(paths.handleInventoryPath, bundle.handleInventory ?? bundle.session.handles),
    ...(bundle.finalOutput ? [writeJsonFile(paths.finalOutputPath, bundle.finalOutput)] : []),
    ...(bundle.rootFrame ? [writeJsonFile(paths.rootFramePath, bundle.rootFrame)] : [])
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
  return loadIfExists(resolveRecursiveLanguageCapabilitiesPath(workspaceRoot), parseRecursiveLanguageCapabilities);
}

export async function loadRecursiveSession(workspaceRoot: string, sessionId: string): Promise<RecursiveSession | null> {
  return loadIfExists(resolveRecursiveSessionPaths(workspaceRoot, sessionId).sessionPath, parseRecursiveSession);
}

export async function writeRecursiveSession(workspaceRoot: string, session: RecursiveSession): Promise<string> {
  const { sessionPath } = resolveRecursiveSessionPaths(workspaceRoot, session.sessionId);
  await writeJsonFile(sessionPath, session);
  return sessionPath;
}

export async function loadRecursiveExecutionPolicy(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveExecutionPolicy | null> {
  return loadIfExists(resolveRecursiveSessionPaths(workspaceRoot, sessionId).executionPolicyPath, parseRecursiveExecutionPolicy);
}

export async function writeRecursiveExecutionPolicy(
  workspaceRoot: string,
  sessionId: string,
  policy: RecursiveExecutionPolicy
): Promise<string> {
  const { executionPolicyPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  await writeJsonFile(executionPolicyPath, policy);
  return executionPolicyPath;
}

export async function loadRecursiveSessionCapabilities(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveLanguageCapabilities | null> {
  return loadIfExists(resolveRecursiveSessionPaths(workspaceRoot, sessionId).capabilitiesPath, parseRecursiveLanguageCapabilities);
}

export async function loadRecursiveSessionSummary(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveSessionSummary | null> {
  return loadIfExists(resolveRecursiveSessionPaths(workspaceRoot, sessionId).summaryPath, parseRecursiveSessionSummary);
}

export async function writeRecursiveSessionSummary(
  workspaceRoot: string,
  sessionId: string,
  summary: RecursiveSessionSummary
): Promise<string> {
  const { summaryPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  await writeJsonFile(summaryPath, summary);
  return summaryPath;
}

export async function loadRecursiveWorkingMemory(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveWorkingMemory | null> {
  return loadIfExists(resolveRecursiveSessionPaths(workspaceRoot, sessionId).memoryPath, parseRecursiveWorkingMemory);
}

export async function writeRecursiveWorkingMemory(
  workspaceRoot: string,
  sessionId: string,
  memory: RecursiveWorkingMemory
): Promise<string> {
  const { memoryPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  await writeJsonFile(memoryPath, memory);
  return memoryPath;
}

export async function loadRecursiveScratchRecord(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveScratchRecord | null> {
  return loadIfExists(resolveRecursiveSessionPaths(workspaceRoot, sessionId).scratchPath, parseRecursiveScratchRecord);
}

export async function writeRecursiveScratchRecord(
  workspaceRoot: string,
  sessionId: string,
  scratch: RecursiveScratchRecord
): Promise<string> {
  const { scratchPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  await writeJsonFile(scratchPath, scratch);
  return scratchPath;
}

export async function loadRecursiveRootFrame(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveRootExecutionFrame | null> {
  return loadIfExists(resolveRecursiveSessionPaths(workspaceRoot, sessionId).rootFramePath, parseRecursiveRootExecutionFrame);
}

export async function writeRecursiveRootFrame(
  workspaceRoot: string,
  sessionId: string,
  frame: RecursiveRootExecutionFrame
): Promise<string> {
  const { rootFramePath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  await writeJsonFile(rootFramePath, frame);
  return rootFramePath;
}

export async function listRecursiveSessionIds(workspaceRoot: string): Promise<string[]> {
  return listDirNames(recursiveSessionsRoot(workspaceRoot));
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
  return listDirNames(resolveRecursiveSessionPaths(workspaceRoot, sessionId).runsDir);
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
  return loadIfExists(resolveRecursiveRunPaths(workspaceRoot, sessionId, runId).metaPath, parseRecursiveStructuredRun);
}

export async function loadRecursiveStructuredRunResult(
  workspaceRoot: string,
  sessionId: string,
  runId: string
): Promise<RecursiveStructuredRunResult | null> {
  return loadIfExists(
    resolveRecursiveRunPaths(workspaceRoot, sessionId, runId).resultPath,
    parseRecursiveStructuredRunResult
  );
}

export async function writeRecursiveIteration(
  workspaceRoot: string,
  iteration: RecursiveIteration,
  frame: RecursiveRootExecutionFrame,
  bundle: RecursiveActionBundle
): Promise<ReturnType<typeof resolveRecursiveIterationPaths>> {
  const paths = resolveRecursiveIterationPaths(workspaceRoot, iteration.sessionId, iteration.iterationId);
  await ensureDir(paths.iterationDir);
  await Promise.all([
    writeJsonFile(paths.iterationPath, iteration),
    writeJsonFile(paths.framePath, frame),
    writeJsonFile(paths.bundlePath, bundle)
  ]);
  return paths;
}

export async function loadRecursiveIteration(
  workspaceRoot: string,
  sessionId: string,
  iterationId: string
): Promise<RecursiveIteration | null> {
  return loadIfExists(resolveRecursiveIterationPaths(workspaceRoot, sessionId, iterationId).iterationPath, parseRecursiveIteration);
}

export async function loadRecursiveIterationFrame(
  workspaceRoot: string,
  sessionId: string,
  iterationId: string
): Promise<RecursiveRootExecutionFrame | null> {
  return loadIfExists(
    resolveRecursiveIterationPaths(workspaceRoot, sessionId, iterationId).framePath,
    parseRecursiveRootExecutionFrame
  );
}

export async function loadRecursiveActionBundle(
  workspaceRoot: string,
  sessionId: string,
  iterationId: string
): Promise<RecursiveActionBundle | null> {
  return loadIfExists(
    resolveRecursiveIterationPaths(workspaceRoot, sessionId, iterationId).bundlePath,
    parseRecursiveActionBundle
  );
}

export async function listRecursiveIterations(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveIteration[]> {
  const dir = resolveRecursiveSessionPaths(workspaceRoot, sessionId).iterationsDir;
  const ids = (await listDirNames(dir)).filter((name) => !name.endsWith(".json"));
  const iterations = await Promise.all(ids.map((id) => loadRecursiveIteration(workspaceRoot, sessionId, id)));
  return iterations
    .filter((iteration): iteration is RecursiveIteration => Boolean(iteration))
    .sort((left, right) => left.sequenceNumber - right.sequenceNumber);
}

export async function writeRecursiveSubcall(
  workspaceRoot: string,
  subcall: RecursiveSubcall
): Promise<string> {
  const filePath = resolveRecursiveSubcallPath(workspaceRoot, subcall.sessionId, subcall.subcallId);
  await writeJsonFile(filePath, subcall);
  return filePath;
}

export async function loadRecursiveSubcall(
  workspaceRoot: string,
  sessionId: string,
  subcallId: string
): Promise<RecursiveSubcall | null> {
  return loadIfExists(resolveRecursiveSubcallPath(workspaceRoot, sessionId, subcallId), parseRecursiveSubcall);
}

export async function listRecursiveSubcalls(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveSubcall[]> {
  const dir = resolveRecursiveSessionPaths(workspaceRoot, sessionId).subcallsDir;
  const fileNames = (await listDirNames(dir)).filter((name) => name.endsWith(".json"));
  const items = await Promise.all(
    fileNames.map((fileName) => loadRecursiveSubcall(workspaceRoot, sessionId, fileName.replace(/\.json$/, "")))
  );
  return items.filter((item): item is RecursiveSubcall => Boolean(item));
}

export async function writeRecursiveCheckpoint(
  workspaceRoot: string,
  checkpoint: RecursiveCheckpoint
): Promise<string> {
  const filePath = resolveRecursiveCheckpointPath(workspaceRoot, checkpoint.sessionId, checkpoint.checkpointId);
  await writeJsonFile(filePath, checkpoint);
  return filePath;
}

export async function loadRecursiveCheckpoint(
  workspaceRoot: string,
  sessionId: string,
  checkpointId: string
): Promise<RecursiveCheckpoint | null> {
  return loadIfExists(resolveRecursiveCheckpointPath(workspaceRoot, sessionId, checkpointId), parseRecursiveCheckpoint);
}

export async function listRecursiveCheckpoints(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveCheckpoint[]> {
  const dir = resolveRecursiveSessionPaths(workspaceRoot, sessionId).checkpointsDir;
  const fileNames = (await listDirNames(dir)).filter((name) => name.endsWith(".json"));
  const items = await Promise.all(
    fileNames.map((fileName) => loadRecursiveCheckpoint(workspaceRoot, sessionId, fileName.replace(/\.json$/, "")))
  );
  return items
    .filter((item): item is RecursiveCheckpoint => Boolean(item))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

export async function writeRecursiveCodeCell(
  workspaceRoot: string,
  cell: RecursiveCodeCell,
  result?: RecursiveCodeCellResult,
  sourceText?: string,
  stdout = "",
  stderr = ""
): Promise<ReturnType<typeof resolveRecursiveCodeCellPaths>> {
  const paths = resolveRecursiveCodeCellPaths(workspaceRoot, cell.sessionId, cell.cellId);
  await ensureDir(paths.cellDir);
  await Promise.all([
    writeJsonFile(paths.cellPath, cell),
    ...(result ? [writeJsonFile(paths.resultPath, result)] : []),
    ...(sourceText !== undefined ? [writeTextFile(paths.sourcePath, sourceText)] : []),
    writeTextFile(paths.stdoutPath, stdout),
    writeTextFile(paths.stderrPath, stderr)
  ]);
  return paths;
}

export async function loadRecursiveCodeCell(
  workspaceRoot: string,
  sessionId: string,
  cellId: string
): Promise<RecursiveCodeCell | null> {
  return loadIfExists(resolveRecursiveCodeCellPaths(workspaceRoot, sessionId, cellId).cellPath, parseRecursiveCodeCell);
}

export async function loadRecursiveCodeCellResult(
  workspaceRoot: string,
  sessionId: string,
  cellId: string
): Promise<RecursiveCodeCellResult | null> {
  return loadIfExists(
    resolveRecursiveCodeCellPaths(workspaceRoot, sessionId, cellId).resultPath,
    parseRecursiveCodeCellResult
  );
}

export async function readRecursiveCodeCellSource(
  workspaceRoot: string,
  sessionId: string,
  cellId: string
): Promise<string | null> {
  const filePath = resolveRecursiveCodeCellPaths(workspaceRoot, sessionId, cellId).sourcePath;
  return (await exists(filePath)) ? readTextFile(filePath) : null;
}

export async function listRecursiveCodeCells(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveCodeCell[]> {
  const dir = resolveRecursiveSessionPaths(workspaceRoot, sessionId).codeCellsDir;
  const ids = (await listDirNames(dir)).filter((name) => !name.endsWith(".json"));
  const items = await Promise.all(ids.map((id) => loadRecursiveCodeCell(workspaceRoot, sessionId, id)));
  return items.filter((item): item is RecursiveCodeCell => Boolean(item));
}

export async function writeRecursivePromotionProposal(
  workspaceRoot: string,
  proposal: RecursivePromotionProposal
): Promise<string> {
  const filePath = resolveRecursivePromotionPath(workspaceRoot, proposal.sessionId, proposal.promotionId);
  await writeJsonFile(filePath, proposal);
  return filePath;
}

export async function loadRecursivePromotionProposal(
  workspaceRoot: string,
  sessionId: string,
  promotionId: string
): Promise<RecursivePromotionProposal | null> {
  return loadIfExists(resolveRecursivePromotionPath(workspaceRoot, sessionId, promotionId), parseRecursivePromotionProposal);
}

export async function listRecursivePromotionProposals(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursivePromotionProposal[]> {
  const dir = resolveRecursiveSessionPaths(workspaceRoot, sessionId).promotionsDir;
  const fileNames = (await listDirNames(dir)).filter((name) => name.endsWith(".json"));
  const items = await Promise.all(
    fileNames.map((fileName) =>
      loadRecursivePromotionProposal(workspaceRoot, sessionId, fileName.replace(/\.json$/, ""))
    )
  );
  return items.filter((item): item is RecursivePromotionProposal => Boolean(item));
}

export async function writeRecursiveMetaOpProposal(
  workspaceRoot: string,
  proposal: RecursiveMetaOpProposal
): Promise<string> {
  const filePath = resolveRecursiveMetaOpPath(workspaceRoot, proposal.sessionId, proposal.metaOpId);
  await writeJsonFile(filePath, proposal);
  return filePath;
}

export async function loadRecursiveMetaOpProposal(
  workspaceRoot: string,
  sessionId: string,
  metaOpId: string
): Promise<RecursiveMetaOpProposal | null> {
  return loadIfExists(resolveRecursiveMetaOpPath(workspaceRoot, sessionId, metaOpId), parseRecursiveMetaOpProposal);
}

export async function listRecursiveMetaOpProposals(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveMetaOpProposal[]> {
  const dir = resolveRecursiveSessionPaths(workspaceRoot, sessionId).metaOpsDir;
  const fileNames = (await listDirNames(dir)).filter((name) => name.endsWith(".json"));
  const items = await Promise.all(
    fileNames.map((fileName) => loadRecursiveMetaOpProposal(workspaceRoot, sessionId, fileName.replace(/\.json$/, "")))
  );
  return items.filter((item): item is RecursiveMetaOpProposal => Boolean(item));
}

export async function writeRecursiveFinalOutput(
  workspaceRoot: string,
  sessionId: string,
  output: RecursiveFinalOutput
): Promise<string> {
  const { finalOutputPath } = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  await writeJsonFile(finalOutputPath, output);
  return finalOutputPath;
}

export async function loadRecursiveFinalOutput(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveFinalOutput | null> {
  return loadIfExists(resolveRecursiveSessionPaths(workspaceRoot, sessionId).finalOutputPath, parseRecursiveFinalOutput);
}

export async function writeRecursiveScorecard(
  workspaceRoot: string,
  scorecard: RecursiveTrajectoryScorecard
): Promise<string> {
  const filePath = resolveRecursiveScorecardPath(workspaceRoot, scorecard.sessionId, scorecard.scorecardId);
  const latestPath = resolveRecursiveSessionPaths(workspaceRoot, scorecard.sessionId).latestScorecardPath;
  await Promise.all([writeJsonFile(filePath, scorecard), writeJsonFile(latestPath, scorecard)]);
  return latestPath;
}

export async function loadRecursiveScorecard(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveTrajectoryScorecard | null> {
  return loadIfExists(resolveRecursiveSessionPaths(workspaceRoot, sessionId).latestScorecardPath, parseRecursiveTrajectoryScorecard);
}

export async function listRecursiveScorecards(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveTrajectoryScorecard[]> {
  const dir = resolveRecursiveSessionPaths(workspaceRoot, sessionId).scorecardsDir;
  const fileNames = (await listDirNames(dir)).filter((name) => name.endsWith(".json") && name !== RUNTIME_RECURSIVE_SCORECARD_FILE);
  const items = await Promise.all(
    fileNames.map((fileName) =>
      loadIfExists(path.join(dir, fileName), parseRecursiveTrajectoryScorecard)
    )
  );
  return items.filter((item): item is RecursiveTrajectoryScorecard => Boolean(item));
}

export function toRecursiveArtifactRef(workspaceRoot: string, absolutePath: string): string {
  return toPortablePath(workspaceRoot, absolutePath);
}
