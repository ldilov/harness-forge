import { z } from "zod";

export const updateActionPlanItemSchema = z.object({
  path: z.string().min(1),
  proposedAction: z.string().min(1),
  reason: z.string().min(1),
  ownershipClass: z.string().optional(),
  recommendedAlternative: z.string().optional()
});

export const updateActionPlanDocumentSchema = z.object({
  operationType: z.string().min(1),
  generatedAt: z.string().min(1),
  workspaceState: z.string().optional(),
  items: z.array(updateActionPlanItemSchema)
});

export type UpdateActionPlanItem = z.infer<typeof updateActionPlanItemSchema>;
export type UpdateActionPlanDocument = z.infer<typeof updateActionPlanDocumentSchema>;

export function parseUpdateActionPlanDocument(value: unknown): UpdateActionPlanDocument {
  return updateActionPlanDocumentSchema.parse(value);
}
