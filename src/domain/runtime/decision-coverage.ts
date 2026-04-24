import { z } from "zod";

import { architectureSignificanceLevelSchema } from "./architecture-significance.js";
import { decisionHealthSeveritySchema } from "./decision-health.js";
import { reviewStatusSchema } from "./file-interest.js";

export const noDecisionRationaleSchema = z.object({
  taskId: z.string().min(1),
  rationale: z.string().min(1),
  recordedAt: z.string().min(1),
  recordedBy: z.string().min(1),
  reviewStatus: reviewStatusSchema
});

export const decisionCoverageClassificationSchema = z.enum([
  "covered",
  "intentionally-uncovered",
  "missing-coverage",
  "not-required",
  "broken-reference",
  "stale-reference"
]);

export const decisionCoverageResultSchema = z.object({
  taskId: z.string().min(1),
  architectureSignificance: architectureSignificanceLevelSchema,
  classification: decisionCoverageClassificationSchema,
  decisionRefs: z.array(z.string().min(1)).default([]),
  noDecisionRationale: noDecisionRationaleSchema.optional(),
  severity: decisionHealthSeveritySchema,
  rationale: z.string().min(1),
  recommendedAction: z.string().min(1)
});

export type NoDecisionRationale = z.infer<typeof noDecisionRationaleSchema>;
export type DecisionCoverageClassification = z.infer<typeof decisionCoverageClassificationSchema>;
export type DecisionCoverageResult = z.infer<typeof decisionCoverageResultSchema>;

export function parseDecisionCoverageResult(value: unknown): DecisionCoverageResult {
  return decisionCoverageResultSchema.parse(value);
}
