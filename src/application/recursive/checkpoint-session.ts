import type { RecursiveCheckpoint } from "../../domain/recursive/checkpoint.js";
import { listRecursiveCheckpoints, writeRecursiveCheckpoint } from "../../infrastructure/recursive/session-store.js";

export interface CreateCheckpointInput {
  workspaceRoot: string;
  sessionId: string;
  iterationId: string;
  summary: string;
  reason: string;
  evidenceRefs?: string[];
}

export async function createRecursiveCheckpoint(input: CreateCheckpointInput): Promise<{
  checkpoint: RecursiveCheckpoint;
  artifactRef: string;
}> {
  const checkpoint: RecursiveCheckpoint = {
    checkpointId: `CHK-${Date.now()}`,
    sessionId: input.sessionId,
    iterationId: input.iterationId,
    summary: input.summary,
    evidenceRefs: input.evidenceRefs ?? [],
    reason: input.reason,
    createdAt: new Date().toISOString()
  };
  const artifactRef = await writeRecursiveCheckpoint(input.workspaceRoot, checkpoint);
  return { checkpoint, artifactRef };
}

export async function summarizeRecursiveCheckpoints(
  workspaceRoot: string,
  sessionId: string
): Promise<string[]> {
  const checkpoints = await listRecursiveCheckpoints(workspaceRoot, sessionId);
  return checkpoints.slice(-3).map((checkpoint) => checkpoint.summary);
}
