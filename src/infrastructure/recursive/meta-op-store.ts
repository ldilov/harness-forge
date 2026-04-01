import type { RecursiveMetaOpProposal } from "../../domain/recursive/meta-op-proposal.js";
import type { RecursivePromotionProposal } from "../../domain/recursive/promotion-proposal.js";
import {
  listRecursiveMetaOpProposals,
  listRecursivePromotionProposals,
  loadRecursiveMetaOpProposal,
  loadRecursivePromotionProposal,
  writeRecursiveMetaOpProposal,
  writeRecursivePromotionProposal
} from "./session-store.js";

export {
  listRecursiveMetaOpProposals,
  listRecursivePromotionProposals,
  loadRecursiveMetaOpProposal,
  loadRecursivePromotionProposal,
  writeRecursiveMetaOpProposal,
  writeRecursivePromotionProposal
};

export async function persistRecursiveMetaOpProposal(
  workspaceRoot: string,
  proposal: RecursiveMetaOpProposal
): Promise<string> {
  return writeRecursiveMetaOpProposal(workspaceRoot, proposal);
}

export async function persistRecursivePromotionProposal(
  workspaceRoot: string,
  proposal: RecursivePromotionProposal
): Promise<string> {
  return writeRecursivePromotionProposal(workspaceRoot, proposal);
}
