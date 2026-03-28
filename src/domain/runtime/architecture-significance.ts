import { z } from "zod";

import { confidenceLevelSchema, reviewStatusSchema } from "./file-interest.js";

export const architectureSignificanceLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export const architectureSignificanceAssessmentSchema = z.object({
  taskId: z.string().min(1),
  level: architectureSignificanceLevelSchema,
  signals: z.array(z.string().min(1)).min(1),
  sourceRefs: z.array(z.string().min(1)).default([]),
  confidence: confidenceLevelSchema,
  reviewStatus: reviewStatusSchema,
  assessedAt: z.string().min(1),
  assessedBy: z.string().min(1)
});

export type ArchitectureSignificanceLevel = z.infer<typeof architectureSignificanceLevelSchema>;
export type ArchitectureSignificanceAssessment = z.infer<typeof architectureSignificanceAssessmentSchema>;

export function parseArchitectureSignificanceAssessment(value: unknown): ArchitectureSignificanceAssessment {
  return architectureSignificanceAssessmentSchema.parse(value);
}

export function isArchitectureSignificant(level: ArchitectureSignificanceLevel): boolean {
  return level === "high" || level === "critical";
}
