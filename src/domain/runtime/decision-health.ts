import { z } from "zod";

export const decisionHealthFindingCategorySchema = z.enum([
  "timestamp-quality",
  "stale-decision",
  "unresolved-decision",
  "broken-lineage",
  "circular-lineage",
  "conflicting-lineage",
  "stale-reference",
  "coverage-gap"
]);

export const decisionHealthSeveritySchema = z.enum(["info", "warning", "blocker"]);

export const decisionHealthFindingSchema = z.object({
  id: z.string().min(1),
  category: decisionHealthFindingCategorySchema,
  severity: decisionHealthSeveritySchema,
  decisionId: z.string().min(1).optional(),
  taskId: z.string().min(1).optional(),
  title: z.string().min(1),
  rationale: z.string().min(1),
  evidence: z.array(z.string().min(1)).default([]),
  recommendedAction: z.string().min(1),
  detectedAt: z.string().min(1)
});

export type DecisionHealthFindingCategory = z.infer<typeof decisionHealthFindingCategorySchema>;
export type DecisionHealthSeverity = z.infer<typeof decisionHealthSeveritySchema>;
export type DecisionHealthFinding = z.infer<typeof decisionHealthFindingSchema>;

export function parseDecisionHealthFinding(value: unknown): DecisionHealthFinding {
  return decisionHealthFindingSchema.parse(value);
}
