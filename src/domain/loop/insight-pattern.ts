import { z } from 'zod';

export const PatternType = z.enum([
  'compaction_affinity',
  'budget_sweet_spot',
  'skill_effectiveness',
  'failure_mode',
  'time_pattern',
  'pack_gap',
]);

export type PatternType = z.infer<typeof PatternType>;

export const PatternRecommendationSchema = z.object({
  action: z.string(),
  params: z.record(z.unknown()).default({}),
  impact: z.string(),
});

export type PatternRecommendation = z.infer<typeof PatternRecommendationSchema>;

export const InsightPatternSchema = z.object({
  id: z.string(),
  type: PatternType,
  confidence: z.number().min(0).max(1),
  sampleSize: z.number().int().nonnegative(),
  discoveredAt: z.string(),
  lastValidated: z.string(),
  finding: z.string(),
  evidence: z.record(z.unknown()).default({}),
  recommendation: PatternRecommendationSchema.optional(),
});

export type InsightPattern = z.infer<typeof InsightPatternSchema>;
