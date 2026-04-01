import { appendRecursiveTraceEvent } from "../../infrastructure/recursive/trace-logger.js";
import {
  loadRecursiveFinalOutput,
  resolveRecursiveSessionPaths,
  writeRecursiveFinalOutput,
  writeRecursiveSession,
  writeRecursiveSessionSummary
} from "../../infrastructure/recursive/session-store.js";
import type { RecursiveFinalOutput } from "../../domain/recursive/final-output.js";
import { loadRecursiveSessionRuntime } from "./load-session-runtime.js";

function synthesizeFinalOutput(sessionId: string, summary: string, artifactRefs: string[]): RecursiveFinalOutput {
  return {
    outputId: `OUT-${Date.now()}`,
    sessionId,
    status: "finalized",
    summary,
    sections: [
      {
        title: "Summary",
        body: summary,
        artifactRefs
      }
    ],
    artifactRefs,
    promotionRefs: [],
    terminalVerdict: "completed",
    generatedAt: new Date().toISOString()
  };
}

export async function finalizeRecursiveSession(workspaceRoot: string, sessionId: string): Promise<{
  status: "finalized" | "missing";
  summaryAvailable: boolean;
  finalOutput?: RecursiveFinalOutput;
}> {
  const runtime = await loadRecursiveSessionRuntime(workspaceRoot, sessionId).catch(() => null);
  if (!runtime) {
    return { status: "missing", summaryAvailable: false };
  }

  const existing = await loadRecursiveFinalOutput(workspaceRoot, sessionId);
  const finalOutput =
    existing ??
    synthesizeFinalOutput(sessionId, runtime.summary.summary, [
      ...(runtime.summary.latestIterationRef ? [runtime.summary.latestIterationRef] : []),
      ...(runtime.summary.latestCheckpointRef ? [runtime.summary.latestCheckpointRef] : [])
    ]);
  const paths = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  const updatedSession = {
    ...runtime.session,
    status: "finalized" as const,
    updatedAt: new Date().toISOString(),
    finalOutputRef: paths.finalOutputPath.replaceAll("\\", "/")
  };
  const updatedSummary = {
    ...runtime.summary,
    outcome: "completed" as const,
    finalOutputRef: paths.finalOutputPath.replaceAll("\\", "/"),
    generatedAt: new Date().toISOString()
  };
  await Promise.all([
    writeRecursiveFinalOutput(workspaceRoot, sessionId, finalOutput),
    writeRecursiveSession(workspaceRoot, updatedSession),
    writeRecursiveSessionSummary(workspaceRoot, sessionId, updatedSummary),
    appendRecursiveTraceEvent(paths.tracePath, {
      eventId: `EVT-${Date.now()}`,
      sessionId,
      eventType: "finalize",
      occurredAt: new Date().toISOString(),
      actor: "runtime",
      inputRefs: [],
      outputRefs: [paths.finalOutputPath.replaceAll("\\", "/")],
      status: "success",
      notes: "Finalized recursive session."
    })
  ]);

  return {
    status: "finalized",
    summaryAvailable: true,
    finalOutput
  };
}
