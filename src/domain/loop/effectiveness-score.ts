import { z } from 'zod';

export const SCORE_WEIGHTS = {
  tokenEfficiency: 0.3,
  taskCompletion: 0.3,
  compactionHealth: 0.2,
  errorRate: 0.1,
  userFriction: 0.1,
} as const;

const score0to100 = z.number().min(0).max(100);

export const ScoreBreakdownSchema = z.object({
  tokenEfficiency: score0to100,
  taskCompletion: score0to100,
  compactionHealth: score0to100,
  errorRate: score0to100,
  userFriction: score0to100,
});

export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;

export const EffectivenessScoreSchema = z.object({
  sessionId: z.string(),
  traceId: z.string(),
  score: score0to100,
  breakdown: ScoreBreakdownSchema,
  scoredAt: z.string(),
  repo: z.string(),
  target: z.string(),
});

export type EffectivenessScore = z.infer<typeof EffectivenessScoreSchema>;
