import {
  listRecursiveCheckpoints,
  listRecursiveCodeCells,
  listRecursiveIterations,
  listRecursiveMetaOpProposals,
  listRecursivePromotionProposals,
  listRecursiveSubcalls
} from "../../infrastructure/recursive/session-store.js";

export async function replayRecursiveSession(workspaceRoot: string, sessionId: string): Promise<{
  sessionId: string;
  events: Array<{ kind: string; id: string; summary: string; occurredAt: string }>;
}> {
  const [iterations, subcalls, checkpoints, codeCells, promotions, metaOps] = await Promise.all([
    listRecursiveIterations(workspaceRoot, sessionId),
    listRecursiveSubcalls(workspaceRoot, sessionId),
    listRecursiveCheckpoints(workspaceRoot, sessionId),
    listRecursiveCodeCells(workspaceRoot, sessionId),
    listRecursivePromotionProposals(workspaceRoot, sessionId),
    listRecursiveMetaOpProposals(workspaceRoot, sessionId)
  ]);
  const events = [
    ...iterations.map((iteration) => ({
      kind: "iteration",
      id: iteration.iterationId,
      summary: iteration.resultSummary,
      occurredAt: iteration.completedAt ?? iteration.startedAt
    })),
    ...subcalls.map((subcall) => ({
      kind: "subcall",
      id: subcall.subcallId,
      summary: subcall.summary ?? subcall.prompt,
      occurredAt: subcall.updatedAt
    })),
    ...checkpoints.map((checkpoint) => ({
      kind: "checkpoint",
      id: checkpoint.checkpointId,
      summary: checkpoint.summary,
      occurredAt: checkpoint.createdAt
    })),
    ...codeCells.map((cell) => ({
      kind: "code-cell",
      id: cell.cellId,
      summary: cell.title ?? `${cell.languageId} cell`,
      occurredAt: cell.updatedAt
    })),
    ...promotions.map((proposal) => ({
      kind: "promotion",
      id: proposal.promotionId,
      summary: proposal.rationale,
      occurredAt: proposal.createdAt
    })),
    ...metaOps.map((proposal) => ({
      kind: "meta-op",
      id: proposal.metaOpId,
      summary: proposal.rationale,
      occurredAt: proposal.createdAt
    }))
  ].sort((left, right) => left.occurredAt.localeCompare(right.occurredAt));

  return { sessionId, events };
}
