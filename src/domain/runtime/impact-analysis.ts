import { z } from "zod";

import { architectureSignificanceAssessmentSchema } from "./architecture-significance.js";
import { confidenceLevelSchema } from "./file-interest.js";

export const impactedModuleSchema = z.object({
  id: z.string().min(1),
  paths: z.array(z.string().min(1)).default([]),
  reason: z.string().min(1),
  confidence: confidenceLevelSchema
});

export const impactAnalysisSchema = z.object({
  taskId: z.string().min(1),
  generatedAt: z.string().min(1),
  basedOnCommit: z.string().optional(),
  architectureSignificance: architectureSignificanceAssessmentSchema.optional(),
  affectedModules: z.array(impactedModuleSchema),
  riskAreas: z.array(z.string().min(1)).default([]),
  suggestedTests: z.array(z.string().min(1)).default([]),
  relatedAdrs: z.array(z.string().min(1)).default([]),
  openQuestions: z.array(z.string().min(1)).default([])
});

export type ImpactedModule = z.infer<typeof impactedModuleSchema>;
export type ImpactAnalysis = z.infer<typeof impactAnalysisSchema>;

export function parseImpactAnalysis(value: unknown): ImpactAnalysis {
  return impactAnalysisSchema.parse(value);
}
