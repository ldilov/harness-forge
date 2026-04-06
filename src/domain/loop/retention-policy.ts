import { z } from 'zod';

export const RetentionTier = z.enum(['hot', 'warm', 'cold']);
export type RetentionTier = z.infer<typeof RetentionTier>;

export const LoopRetentionPolicySchema = z.object({
  hotDays: z.number().int().positive().default(30),
  warmDays: z.number().int().positive().default(90),
  // Beyond warmDays = cold (delete traces, keep only aggregates)
});
export type LoopRetentionPolicy = z.infer<typeof LoopRetentionPolicySchema>;

export const DailyTraceDigestSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  sessionCount: z.number().int().nonnegative(),
  avgScore: z.number().min(0).max(100),
  totalTokensUsed: z.number().int().nonnegative(),
  totalTokensSaved: z.number().int().nonnegative(),
  compactionCount: z.number().int().nonnegative(),
  topStrategies: z.array(z.string()),
  errorCount: z.number().int().nonnegative(),
});
export type DailyTraceDigest = z.infer<typeof DailyTraceDigestSchema>;
