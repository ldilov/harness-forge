import { z } from "zod";

import { recursivePromotionKindSchema } from "./action-bundle.js";

export const recursivePromotionProposalStatusSchema = z.enum([
  "draft",
  "proposed",
  "reviewed",
  "promoted",
  "rejected",
  "revised"
]);

export const recursivePromotionProposalSchema = z.object({
  promotionId: z.string().min(1),
  sessionId: z.string().min(1),
  promotionKind: recursivePromotionKindSchema,
  sourceRefs: z.array(z.string().min(1)).default([]),
  targetSurface: z.string().min(1),
  status: recursivePromotionProposalStatusSchema,
  rationale: z.string().min(1),
  verificationSummary: z.string().min(1).optional(),
  createdAt: z.string().min(1)
});

export type RecursivePromotionProposal = z.infer<typeof recursivePromotionProposalSchema>;

export function parseRecursivePromotionProposal(value: unknown): RecursivePromotionProposal {
  return recursivePromotionProposalSchema.parse(value);
}
