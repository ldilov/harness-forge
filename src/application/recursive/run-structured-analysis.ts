import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import type { RecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import type { RecursiveLanguageCapabilities } from "../../domain/recursive/language-capabilities.js";
import type { RecursiveSession } from "../../domain/recursive/session.js";
import type { RecursiveStructuredRun, RecursiveRunSubmissionMode, RecursiveRunStatus } from "../../domain/recursive/structured-run.js";
import type { RecursiveRunOutcome, RecursiveStructuredRunResult } from "../../domain/recursive/structured-run-result.js";
import type { RecursiveTraceEvent } from "../../domain/recursive/trace-event.js";
import { ValidationError, ensureDir, exists, readJsonFile, readTextFile, writeJsonFile, writeTextFile } from "../../shared/index.js";
import {
  appendRecursiveTraceEvent
} from "../../infrastructure/recursive/trace-logger.js";
import {
  loadRecursiveExecutionPolicy,
  loadRecursiveLanguageCapabilities,
  loadRecursiveSession,
  loadRecursiveSessionCapabilities,
  resolveRecursiveRunPaths,
  resolveRecursiveSessionPaths,
  writeRecursiveLanguageCapabilities,
  writeRecursiveStructuredRun
} from "../../infrastructure/recursive/session-store.js";
import { deriveRecursiveLanguageCapabilities } from "./derive-language-capabilities.js";

interface StructuredAnalysisSnippetMetadata {
  version?: number;
  kind?: string;
  requestedBehaviors?: string[];
  title?: string;
}

interface StructuredAnalysisSnippetResult {
  outcome?: RecursiveRunOutcome;
  summary?: string;
  findings?: string[];
  warnings?: string[];
  diagnostics?: string[];
  artifactsRead?: string[];
  artifactsWritten?: string[];
}

export interface RunStructuredAnalysisInput {
  workspaceRoot: string;
  sessionId: string;
  submissionMode: RecursiveRunSubmissionMode;
  sourceFile?: string;
  stdinContent?: string;
}

export interface RunStructuredAnalysisOutput {
  meta: RecursiveStructuredRun;
  result: RecursiveStructuredRunResult;
  artifactPaths: ReturnType<typeof resolveRecursiveRunPaths>;
}

interface StructuredAnalysisModule {
  metadata?: StructuredAnalysisSnippetMetadata;
  analyze?: (context: StructuredAnalysisContext) => Promise<StructuredAnalysisSnippetResult | void> | StructuredAnalysisSnippetResult | void;
  default?: (context: StructuredAnalysisContext) => Promise<StructuredAnalysisSnippetResult | void> | StructuredAnalysisSnippetResult | void;
}

interface StructuredAnalysisContext {
  sessionId: string;
  workspaceRoot: string;
  session: RecursiveSession;
  executionPolicy: RecursiveExecutionPolicy;
  capabilities: RecursiveLanguageCapabilities;
  scratchPath: string;
  tracePath: string;
  handles: RecursiveSession["handles"];
  resolveHandle: (handleId: string) => string;
  readHandle: (handleId: string) => Promise<unknown>;
  appendScratch: (note: string) => Promise<void>;
  log: (note: string) => Promise<void>;
}

function createRunId(): string {
  return `RUN-${Date.now()}`;
}

function toPortablePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function hashText(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function createTraceEvent(
  sessionId: string,
  runId: string,
  status: "success" | "failed",
  notes: string
): RecursiveTraceEvent {
  return {
    eventId: `EVT-${Date.now()}`,
    sessionId,
    eventType: "tool-call",
    occurredAt: new Date().toISOString(),
    actor: "operator",
    inputRefs: [runId],
    outputRefs: [],
    status,
    budgetImpact: {
      iterationsUsed: 1,
      subcallsUsed: 0
    },
    notes
  };
}

async function loadSessionContext(workspaceRoot: string, sessionId: string): Promise<{
  session: RecursiveSession;
  executionPolicy: RecursiveExecutionPolicy;
  capabilities: RecursiveLanguageCapabilities;
}> {
  const session = await loadRecursiveSession(workspaceRoot, sessionId);
  if (!session) {
    throw new ValidationError(`Recursive session not found: ${sessionId}`);
  }

  const executionPolicy = await loadRecursiveExecutionPolicy(workspaceRoot, sessionId);
  if (!executionPolicy) {
    throw new ValidationError(`Recursive execution policy not found for session ${sessionId}`);
  }

  const sessionCapabilities = await loadRecursiveSessionCapabilities(workspaceRoot, sessionId);
  if (sessionCapabilities) {
    return { session, executionPolicy, capabilities: sessionCapabilities };
  }

  const workspaceCapabilities =
    (await loadRecursiveLanguageCapabilities(workspaceRoot)) ?? (await deriveRecursiveLanguageCapabilities(workspaceRoot));
  await writeRecursiveLanguageCapabilities(workspaceRoot, workspaceCapabilities);
  return { session, executionPolicy, capabilities: workspaceCapabilities };
}

async function readSnippetSource(input: RunStructuredAnalysisInput): Promise<{ sourceText: string; sourceRef?: string }> {
  if (input.submissionMode === "stdin") {
    if (!input.stdinContent?.trim()) {
      throw new ValidationError("Structured analysis run with --stdin requires snippet content on stdin.");
    }
    return {
      sourceText: input.stdinContent,
      sourceRef: undefined
    };
  }

  if (!input.sourceFile) {
    throw new ValidationError("Structured analysis run with --file requires a snippet file path.");
  }

  const sourceRef = path.resolve(input.sourceFile);
  return {
    sourceText: await readTextFile(sourceRef),
    sourceRef
  };
}

async function importSnippetModule(snippetPath: string): Promise<StructuredAnalysisModule> {
  const url = pathToFileURL(snippetPath);
  url.searchParams.set("run", `${Date.now()}`);
  return (await import(url.href)) as StructuredAnalysisModule;
}

function normalizeRequestedBehaviors(value: StructuredAnalysisSnippetMetadata | undefined): string[] {
  return [...new Set(value?.requestedBehaviors ?? [])].sort((left, right) => left.localeCompare(right));
}

function ensureRequestedBehaviorsAllowed(policy: RecursiveExecutionPolicy, requestedBehaviors: string[]): void {
  if (!policy.allowStructuredRun) {
    throw new ValidationError(`Structured recursive runs are disabled by policy ${policy.policyId}.`);
  }

  const rejectedBehavior = requestedBehaviors.find((behavior) => policy.restrictedBehaviors.includes(behavior));
  if (rejectedBehavior) {
    throw new ValidationError(`Structured recursive run requested restricted behavior "${rejectedBehavior}".`);
  }
}

function ensureSubmissionAllowed(policy: RecursiveExecutionPolicy, submissionMode: RecursiveRunSubmissionMode): void {
  if (!policy.allowedInputs.includes(submissionMode)) {
    throw new ValidationError(`Structured recursive runs do not allow ${submissionMode} input under policy ${policy.policyId}.`);
  }
}

async function createStructuredContext(
  workspaceRoot: string,
  session: RecursiveSession,
  executionPolicy: RecursiveExecutionPolicy,
  capabilities: RecursiveLanguageCapabilities,
  runId: string
): Promise<StructuredAnalysisContext> {
  const sessionPaths = resolveRecursiveSessionPaths(workspaceRoot, session.sessionId);
  const handleMap = new Map(session.handles.map((handle) => [handle.handleId, handle]));
  const scratchFile = path.join(sessionPaths.sessionDir, "scratch", `${runId}.md`);
  await ensureDir(path.dirname(scratchFile));

  const resolveHandle = (handleId: string): string => {
    const handle = handleMap.get(handleId);
    if (!handle) {
      throw new ValidationError(`Unknown recursive handle: ${handleId}`);
    }
    return path.resolve(workspaceRoot, handle.targetRef);
  };

  return {
    sessionId: session.sessionId,
    workspaceRoot,
    session,
    executionPolicy,
    capabilities,
    scratchPath: scratchFile,
    tracePath: sessionPaths.tracePath,
    handles: session.handles,
    resolveHandle,
    async readHandle(handleId: string): Promise<unknown> {
      const resolved = resolveHandle(handleId);
      if (!(await exists(resolved))) {
        throw new ValidationError(`Referenced recursive handle is missing on disk: ${handleId}`);
      }
      if (resolved.endsWith(".json")) {
        return readJsonFile<unknown>(resolved);
      }
      return readTextFile(resolved);
    },
    async appendScratch(note: string): Promise<void> {
      await fs.appendFile(scratchFile, `${note.trim()}\n`, "utf8");
    },
    async log(note: string): Promise<void> {
      await appendRecursiveTraceEvent(
        sessionPaths.tracePath,
        createTraceEvent(session.sessionId, runId, "success", `[structured-run] ${note}`)
      );
    }
  };
}

async function executeSnippetWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new ValidationError(`Structured recursive run timed out after ${timeoutMs}ms.`)), timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function normalizeSnippetResult(value: StructuredAnalysisSnippetResult | void, runId: string): RecursiveStructuredRunResult {
  const findings = value?.findings ?? [];
  const warnings = value?.warnings ?? [];
  const diagnostics = value?.diagnostics ?? [];
  const outcome = value?.outcome ?? (findings.length > 0 ? "success" : "degraded");

  return {
    runId,
    outcome,
    findings,
    warnings,
    diagnostics,
    artifactsRead: value?.artifactsRead ?? [],
    artifactsWritten: value?.artifactsWritten ?? [],
    completedAt: new Date().toISOString()
  };
}

function createMetaRecord(input: {
  runId: string;
  sessionId: string;
  submissionMode: RecursiveRunSubmissionMode;
  sourceRef?: string;
  policyRef: string;
  status: RecursiveRunStatus;
  summary: string;
  resultRef?: string;
  requestedBehaviors?: string[];
  warningCount?: number;
  failureReason?: string;
  startedAt: string;
  completedAt?: string;
}): RecursiveStructuredRun {
  return {
    runId: input.runId,
    sessionId: input.sessionId,
    submissionMode: input.submissionMode,
    sourceRef: input.sourceRef,
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    policyRef: input.policyRef,
    resultRef: input.resultRef,
    summary: input.summary,
    warningCount: input.warningCount,
    failureReason: input.failureReason,
    ...(input.requestedBehaviors && input.requestedBehaviors.length > 0 ? { requestedBehaviors: input.requestedBehaviors } : {})
  };
}

export async function runStructuredAnalysis(input: RunStructuredAnalysisInput): Promise<RunStructuredAnalysisOutput> {
  const { workspaceRoot, sessionId, submissionMode } = input;
  const { session, executionPolicy, capabilities } = await loadSessionContext(workspaceRoot, sessionId);
  ensureSubmissionAllowed(executionPolicy, submissionMode);

  const existingRunCount = (await fs.readdir(resolveRecursiveSessionPaths(workspaceRoot, sessionId).runsDir).catch(() => [])).length;
  if (existingRunCount >= executionPolicy.budgetSummary.maxRuns) {
    throw new ValidationError(
      `Structured recursive run budget exhausted for session ${sessionId}; policy ${executionPolicy.policyId} allows at most ${executionPolicy.budgetSummary.maxRuns} runs.`
    );
  }

  const runId = createRunId();
  const startedAt = new Date().toISOString();
  const { sourceText, sourceRef } = await readSnippetSource(input);
  const artifactPaths = resolveRecursiveRunPaths(workspaceRoot, sessionId, runId);
  const sessionPaths = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  await ensureDir(artifactPaths.runDir);

  const snippetPath = path.join(artifactPaths.runDir, submissionMode === "stdin" ? "stdin-snippet.mjs" : "snippet.mjs");
  await writeTextFile(snippetPath, sourceText);

  try {
    const snippetModule = await importSnippetModule(snippetPath);
    const analyzer = snippetModule.analyze ?? snippetModule.default;
    if (typeof analyzer !== "function") {
      throw new ValidationError("Structured recursive snippets must export an async analyze(context) function or a default function.");
    }

    const requestedBehaviors = normalizeRequestedBehaviors(snippetModule.metadata);
    ensureRequestedBehaviorsAllowed(executionPolicy, requestedBehaviors);

    const context = await createStructuredContext(workspaceRoot, session, executionPolicy, capabilities, runId);
    const rawResult = await executeSnippetWithTimeout(
      async () => analyzer(context),
      executionPolicy.budgetSummary.maxDurationMs
    );

    const result = normalizeSnippetResult(rawResult, runId);
    const resultRef = toPortablePath(path.relative(workspaceRoot, artifactPaths.resultPath) || artifactPaths.resultPath);
    const meta = createMetaRecord({
      runId,
      sessionId,
      submissionMode,
      sourceRef: sourceRef ?? `sha256:${hashText(sourceText)}`,
      policyRef: toPortablePath(path.relative(workspaceRoot, sessionPaths.executionPolicyPath)),
      status: result.outcome === "degraded" ? "degraded" : "success",
      summary: rawResult?.summary ?? (result.findings[0] ?? "Structured recursive analysis completed."),
      resultRef,
      requestedBehaviors,
      warningCount: result.warnings.length,
      startedAt,
      completedAt: result.completedAt
    });

    await writeRecursiveStructuredRun(workspaceRoot, sessionId, { meta, result });
    await appendRecursiveTraceEvent(
      sessionPaths.tracePath,
      createTraceEvent(sessionId, runId, "success", `Structured recursive run completed with outcome ${result.outcome}.`)
    );

    return { meta, result, artifactPaths };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const outcome: RecursiveRunOutcome = error instanceof ValidationError ? "rejection" : "failure";
    const status: RecursiveRunStatus = outcome === "rejection" ? "rejection" : "failure";
    const result: RecursiveStructuredRunResult = {
      runId,
      outcome,
      findings: [],
      warnings: [],
      diagnostics: [message],
      artifactsRead: [],
      artifactsWritten: [],
      completedAt: new Date().toISOString()
    };
    const meta = createMetaRecord({
      runId,
      sessionId,
      submissionMode,
      sourceRef: sourceRef ?? `sha256:${hashText(sourceText)}`,
      policyRef: toPortablePath(path.relative(workspaceRoot, sessionPaths.executionPolicyPath)),
      status,
      summary: "Structured recursive analysis did not complete successfully.",
      resultRef: toPortablePath(path.relative(workspaceRoot, artifactPaths.resultPath)),
      warningCount: 0,
      failureReason: message,
      startedAt,
      completedAt: result.completedAt
    });

    await writeRecursiveStructuredRun(workspaceRoot, sessionId, { meta, result });
    await appendRecursiveTraceEvent(
      sessionPaths.tracePath,
      createTraceEvent(sessionId, runId, "failed", `Structured recursive run failed: ${message}`)
    );
    return { meta, result, artifactPaths };
  }
}
