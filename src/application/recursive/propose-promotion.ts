import type { RecursiveAction } from "../../domain/recursive/action-bundle.js";
import type { RecursivePromotionProposal } from "../../domain/recursive/promotion-proposal.js";
import { persistRecursivePromotionProposal } from "../../infrastructure/recursive/meta-op-store.js";

export interface ProposePromotionInput {
  workspaceRoot: string;
  sessionId: string;
  action: Extract<RecursiveAction, { kind: "propose-promotion" }>;
}

export async function proposeRecursivePromotion(input: ProposePromotionInput): Promise<{
  proposal: RecursivePromotionProposal;
  artifactRef: string;
}> {
  const proposal: RecursivePromotionProposal = {
    promotionId: `PROMO-${Date.now()}`,
    sessionId: input.sessionId,
    promotionKind: input.action.args.promotionKind,
    sourceRefs: input.action.args.sourceRefs,
    targetSurface: input.action.args.targetSurface,
    status: "proposed",
    rationale: input.action.args.rationale,
    verificationSummary: input.action.args.verificationSummary,
    createdAt: new Date().toISOString()
  };
  const artifactRef = await persistRecursivePromotionProposal(input.workspaceRoot, proposal);
  return { proposal, artifactRef };
}
