import { z } from "zod";

export const recursiveTrajectoryScorecardSchema = z.object({
  scorecardId: z.string().min(1),
  sessionId: z.string().min(1),
  effectivenessScore: z.number().min(0).max(1),
  efficiencyScore: z.number().min(0).max(1),
  evidenceQualityScore: z.number().min(0).max(1),
  promotionQualityScore: z.number().min(0).max(1),
  safetyScore: z.number().min(0).max(1),
  wasteSignals: z.array(z.string().min(1)).default([]),
  recommendations: z.array(z.string().min(1)).default([]),
  generatedAt: z.string().min(1)
});

export type RecursiveTrajectoryScorecard = z.infer<typeof recursiveTrajectoryScorecardSchema>;

export function parseRecursiveTrajectoryScorecard(value: unknown): RecursiveTrajectoryScorecard {
  return recursiveTrajectoryScorecardSchema.parse(value);
}
