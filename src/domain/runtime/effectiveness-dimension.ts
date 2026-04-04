import { z } from "zod";
import { confidenceLevelSchema } from "./effectiveness-signal.js";

export const effectivenessDimensionIdSchema = z.enum([
  "repoUnderstanding",
  "targetCorrectness",
  "runtimeAdoption",
  "maintenanceHygiene",
  "workContinuity",
  "recommendationFollowThrough"
]);

export const effectivenessDimensionScoreSchema = z.object({
  dimensionId: effectivenessDimensionIdSchema,
  score: z.number().min(0).max(100),
  evidence: z.array(z.string().min(1)),
  confidenceLevel: confidenceLevelSchema,
  signalCount: z.number().int().min(0)
});

export type EffectivenessDimensionId = z.infer<typeof effectivenessDimensionIdSchema>;
export type EffectivenessDimensionScore = z.infer<typeof effectivenessDimensionScoreSchema>;

export function parseEffectivenessDimensionScore(value: unknown): EffectivenessDimensionScore {
  return effectivenessDimensionScoreSchema.parse(value);
}
