import type { RecursiveAction } from "../../domain/recursive/action-bundle.js";
import type { RecursiveMetaOpProposal } from "../../domain/recursive/meta-op-proposal.js";
import { persistRecursiveMetaOpProposal } from "../../infrastructure/recursive/meta-op-store.js";

export interface ProposeMetaOpInput {
  workspaceRoot: string;
  sessionId: string;
  action: Extract<RecursiveAction, { kind: "propose-meta-op" }>;
}

export async function proposeRecursiveMetaOp(input: ProposeMetaOpInput): Promise<{
  proposal: RecursiveMetaOpProposal;
  artifactRef: string;
}> {
  const proposal: RecursiveMetaOpProposal = {
    metaOpId: `META-${Date.now()}`,
    sessionId: input.sessionId,
    targetKind: input.action.args.targetKind,
    targetRef: input.action.args.targetRef,
    rationale: input.action.args.rationale,
    patchSummary: input.action.args.patchSummary,
    status: "proposed",
    createdAt: new Date().toISOString()
  };
  const artifactRef = await persistRecursiveMetaOpProposal(input.workspaceRoot, proposal);
  return { proposal, artifactRef };
}
