import path from "node:path";

import type { RecursiveActionBundle } from "../../domain/recursive/action-bundle.js";
import type { RecursiveFinalOutput } from "../../domain/recursive/final-output.js";
import type { RecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import type { RecursiveTraceEvent } from "../../domain/recursive/trace-event.js";
import { ValidationError, readTextFile } from "../../shared/index.js";
import { appendRecursiveTraceEvent } from "../../infrastructure/recursive/trace-logger.js";
import {
  listRecursiveCheckpoints,
  listRecursiveIterations,
  resolveRecursiveSessionPaths,
  toRecursiveArtifactRef,
  writeRecursiveFinalOutput,
  writeRecursiveIteration,
  writeRecursiveRootFrame,
  writeRecursiveSession,
  writeRecursiveSessionSummary,
  writeRecursiveWorkingMemory
} from "../../infrastructure/recursive/session-store.js";
import { buildRecursiveRootFrame } from "./build-root-frame.js";
import { executeActionBundle } from "./execute-action-bundle.js";
import { loadRecursiveSessionRuntime } from "./load-session-runtime.js";
import { parseActionBundle } from "./parse-action-bundle.js";

export interface ExecuteRlmInput {
  workspaceRoot: string;
  sessionId: string;
  sourceFile?: string;
  stdinContent?: string;
}

export interface ExecuteRlmOutput {
  bundle: RecursiveActionBundle;
  iteration: Awaited<ReturnType<typeof executeActionBundle>>["iteration"];
  finalOutput?: RecursiveFinalOutput;
  artifactPaths: ReturnType<typeof resolveRecursiveSessionPaths>;
}

function createTraceEvent(sessionId: string, outputRefs: string[], note: string): RecursiveTraceEvent {
  return {
    eventId: `EVT-${Date.now()}`,
    sessionId,
    eventType: "iteration",
    occurredAt: new Date().toISOString(),
    actor: "runtime",
    inputRefs: [],
    outputRefs,
    status: "success",
    budgetImpact: {
      iterationsUsed: 1
    },
    notes: note
  };
}

function updateSummary(summary: RecursiveSessionSummary, input: {
  latestIterationRef: string;
  latestCheckpointRef?: string;
  finalOutputRef?: string;
  scorecardRef?: string;
  resultSummary: string;
  followUp: string;
  outcome: RecursiveSessionSummary["outcome"];
}): RecursiveSessionSummary {
  return {
    ...summary,
    outcome: input.outcome,
    summary: input.resultSummary,
    followUp: input.followUp,
    generatedAt: new Date().toISOString(),
    latestIterationRef: input.latestIterationRef,
    ...(input.latestCheckpointRef ? { latestCheckpointRef: input.latestCheckpointRef } : {}),
    ...(input.finalOutputRef ? { finalOutputRef: input.finalOutputRef } : {}),
    ...(input.scorecardRef ? { scorecardRef: input.scorecardRef } : {})
  };
}

export async function executeRecursiveLanguageModel(input: ExecuteRlmInput): Promise<ExecuteRlmOutput> {
  if (!input.sourceFile && !input.stdinContent) {
    throw new ValidationError('Provide either "--file <bundle.json>" or "--stdin" for recursive RLM execution.');
  }

  const runtime = await loadRecursiveSessionRuntime(input.workspaceRoot, input.sessionId);
  const iterationCount = (await listRecursiveIterations(input.workspaceRoot, input.sessionId)).length;
  if (iterationCount >= runtime.policy.budgetSummary.maxIterations) {
    throw new ValidationError(
      `Recursive iteration budget exhausted for session ${input.sessionId}; policy ${runtime.policy.policyId} allows at most ${runtime.policy.budgetSummary.maxIterations} iterations.`
    );
  }

  const checkpoints = await listRecursiveCheckpoints(input.workspaceRoot, input.sessionId);
  const frame = buildRecursiveRootFrame({
    session: runtime.session,
    policy: runtime.policy,
    memory: runtime.memory,
    summary: runtime.summary,
    checkpoints
  });
  const iterationId = `ITER-${Date.now()}`;
  const sourceText = input.sourceFile ? await readTextFile(path.resolve(input.sourceFile)) : input.stdinContent ?? "";
  const bundle = parseActionBundle({
    sessionId: input.sessionId,
    iterationId,
    sourceText
  });
  const executed = await executeActionBundle({
    workspaceRoot: input.workspaceRoot,
    bundle,
    frame,
    memory: runtime.memory,
    policy: runtime.policy,
    handles: runtime.session.handles.map((handle) => ({ handleId: handle.handleId, targetRef: handle.targetRef })),
    sequenceNumber: iterationCount + 1
  });
  const artifactPaths = resolveRecursiveSessionPaths(input.workspaceRoot, input.sessionId);
  const latestCheckpoint = (await listRecursiveCheckpoints(input.workspaceRoot, input.sessionId)).at(-1);
  const finalOutputRef = executed.finalOutput
    ? toRecursiveArtifactRef(input.workspaceRoot, artifactPaths.finalOutputPath)
    : runtime.session.finalOutputRef;
  const nextStatus: "running" | "finalized" = executed.finalOutput ? "finalized" : "running";

  const updatedSession = {
    ...runtime.session,
    status: nextStatus,
    updatedAt: new Date().toISOString(),
    rootFrameRef: toRecursiveArtifactRef(input.workspaceRoot, artifactPaths.rootFramePath),
    summaryRef: toRecursiveArtifactRef(input.workspaceRoot, artifactPaths.summaryPath),
    memoryRef: toRecursiveArtifactRef(input.workspaceRoot, artifactPaths.memoryPath),
    finalOutputRef,
    iterationCount: runtime.session.iterationCount + 1,
    subcallCount: runtime.session.subcallCount + executed.counts.subcalls,
    codeCellCount: runtime.session.codeCellCount + executed.counts.codeCells,
    checkpointCount: runtime.session.checkpointCount + executed.counts.checkpoints
  };
  const updatedSummary = updateSummary(runtime.summary, {
    latestIterationRef: `iterations/${iterationId}/iteration.json`,
    latestCheckpointRef: latestCheckpoint ? `checkpoints/${latestCheckpoint.checkpointId}.json` : runtime.summary.latestCheckpointRef,
    finalOutputRef,
    resultSummary: executed.iteration.resultSummary,
    followUp: executed.finalOutput ? "Review the finalized output and any proposal artifacts." : executed.memory.nextStep,
    outcome: executed.finalOutput ? "completed" : executed.iteration.status === "blocked" ? "blocked" : "partial"
  });

  await Promise.all([
    writeRecursiveRootFrame(input.workspaceRoot, input.sessionId, frame),
    writeRecursiveIteration(input.workspaceRoot, executed.iteration, frame, bundle),
    writeRecursiveWorkingMemory(input.workspaceRoot, input.sessionId, executed.memory),
    writeRecursiveSessionSummary(input.workspaceRoot, input.sessionId, updatedSummary),
    writeRecursiveSession(input.workspaceRoot, updatedSession),
    ...(executed.finalOutput ? [writeRecursiveFinalOutput(input.workspaceRoot, input.sessionId, executed.finalOutput)] : [])
  ]);
  await appendRecursiveTraceEvent(
    artifactPaths.tracePath,
    createTraceEvent(
      input.sessionId,
      [
        `iterations/${iterationId}/iteration.json`,
        ...(executed.finalOutput ? [toRecursiveArtifactRef(input.workspaceRoot, artifactPaths.finalOutputPath)] : [])
      ],
      `Executed recursive action bundle ${bundle.bundleId}.`
    )
  );

  return {
    bundle,
    iteration: executed.iteration,
    finalOutput: executed.finalOutput,
    artifactPaths
  };
}
