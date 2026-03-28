import { loadRecursiveSessionSummary } from "../../infrastructure/recursive/session-store.js";

export async function finalizeRecursiveSession(workspaceRoot: string, sessionId: string): Promise<{
  sessionId: string;
  status: "not-implemented";
  summaryAvailable: boolean;
}> {
  const summary = await loadRecursiveSessionSummary(workspaceRoot, sessionId);
  return {
    sessionId,
    status: "not-implemented",
    summaryAvailable: Boolean(summary)
  };
}
