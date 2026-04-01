import { appendRecursiveTraceEvent } from "../../infrastructure/recursive/trace-logger.js";
import {
  listRecursiveCheckpoints,
  loadRecursiveSessionSummary,
  loadRecursiveWorkingMemory,
  resolveRecursiveSessionPaths,
  writeRecursiveSession,
  writeRecursiveSessionSummary
} from "../../infrastructure/recursive/session-store.js";
import { loadRecursiveSessionRuntime } from "./load-session-runtime.js";

export async function compactRecursiveSession(workspaceRoot: string, sessionId: string): Promise<{
  status: "compacted" | "missing";
  summaryAvailable: boolean;
  compactedSummary?: string;
}> {
  const summary = await loadRecursiveSessionSummary(workspaceRoot, sessionId);
  if (!summary) {
    return { status: "missing", summaryAvailable: false };
  }

  const runtime = await loadRecursiveSessionRuntime(workspaceRoot, sessionId);
  const [memory, checkpoints] = await Promise.all([
    loadRecursiveWorkingMemory(workspaceRoot, sessionId),
    listRecursiveCheckpoints(workspaceRoot, sessionId)
  ]);
  const compactedSummary = [
    runtime.summary.summary,
    ...(memory?.confirmedFacts.slice(0, 5) ?? []),
    ...(checkpoints.slice(-2).map((checkpoint) => checkpoint.summary))
  ].join(" | ");
  const updatedSession = {
    ...runtime.session,
    compactedSummary,
    updatedAt: new Date().toISOString()
  };
  const updatedSummary = {
    ...runtime.summary,
    summary: compactedSummary,
    generatedAt: new Date().toISOString()
  };
  const paths = resolveRecursiveSessionPaths(workspaceRoot, sessionId);
  await Promise.all([
    writeRecursiveSession(workspaceRoot, updatedSession),
    writeRecursiveSessionSummary(workspaceRoot, sessionId, updatedSummary),
    appendRecursiveTraceEvent(paths.tracePath, {
      eventId: `EVT-${Date.now()}`,
      sessionId,
      eventType: "compact",
      occurredAt: new Date().toISOString(),
      actor: "runtime",
      inputRefs: [],
      outputRefs: [paths.summaryPath.replaceAll("\\", "/")],
      status: "success",
      notes: "Compacted recursive session summary."
    })
  ]);

  return {
    status: "compacted",
    summaryAvailable: true,
    compactedSummary
  };
}
