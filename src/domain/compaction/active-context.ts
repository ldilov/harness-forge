import { z } from 'zod';

export const ActiveContextSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  objective: z.string().min(1),
  acceptedPlan: z.array(z.string()),
  latestDeltaRef: z.string().min(1),
  sessionSummaryRef: z.string().min(1),
  authorityMapRef: z.string().optional(),
  targetPosture: z.record(z.string(), z.string()),
  unresolved: z.array(z.string()),
  budgetRef: z.string().optional(),
});

export type ActiveContext = z.infer<typeof ActiveContextSchema>;
