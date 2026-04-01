import { ValidationError } from "../../shared/index.js";
import type { RecursiveExecutionPolicy } from "../../domain/recursive/execution-policy.js";
import type { RecursiveSession } from "../../domain/recursive/session.js";
import type { RecursiveSessionSummary } from "../../domain/recursive/session-summary.js";
import type { RecursiveWorkingMemory } from "../../domain/recursive/memory.js";
import {
  loadRecursiveExecutionPolicy,
  loadRecursiveSession,
  loadRecursiveSessionSummary,
  loadRecursiveWorkingMemory
} from "../../infrastructure/recursive/session-store.js";

export interface RecursiveSessionRuntime {
  session: RecursiveSession;
  policy: RecursiveExecutionPolicy;
  summary: RecursiveSessionSummary;
  memory: RecursiveWorkingMemory;
}

export async function loadRecursiveSessionRuntime(
  workspaceRoot: string,
  sessionId: string
): Promise<RecursiveSessionRuntime> {
  const [session, policy, summary, memory] = await Promise.all([
    loadRecursiveSession(workspaceRoot, sessionId),
    loadRecursiveExecutionPolicy(workspaceRoot, sessionId),
    loadRecursiveSessionSummary(workspaceRoot, sessionId),
    loadRecursiveWorkingMemory(workspaceRoot, sessionId)
  ]);

  if (!session) {
    throw new ValidationError(`Recursive session not found: ${sessionId}`);
  }
  if (!policy) {
    throw new ValidationError(`Recursive execution policy not found for session ${sessionId}`);
  }
  if (!summary) {
    throw new ValidationError(`Recursive session summary not found for session ${sessionId}`);
  }
  if (!memory) {
    throw new ValidationError(`Recursive working memory not found for session ${sessionId}`);
  }

  return { session, policy, summary, memory };
}
