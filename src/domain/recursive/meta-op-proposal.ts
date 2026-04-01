import { z } from "zod";

export const recursiveMetaOpProposalStatusSchema = z.enum([
  "draft",
  "proposed",
  "reviewed",
  "promoted",
  "rejected",
  "revised"
]);

export const recursiveMetaOpProposalSchema = z.object({
  metaOpId: z.string().min(1),
  sessionId: z.string().min(1),
  targetKind: z.string().min(1),
  targetRef: z.string().min(1),
  rationale: z.string().min(1),
  patchSummary: z.string().min(1),
  status: recursiveMetaOpProposalStatusSchema,
  createdAt: z.string().min(1)
});

export type RecursiveMetaOpProposal = z.infer<typeof recursiveMetaOpProposalSchema>;

export function parseRecursiveMetaOpProposal(value: unknown): RecursiveMetaOpProposal {
  return recursiveMetaOpProposalSchema.parse(value);
}
