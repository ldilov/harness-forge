import { z } from 'zod';

export const SessionSummarySchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  summaryId: z.string().min(1),
  createdAt: z.string().min(1),
  coversEvents: z.tuple([z.string(), z.string()]),
  objective: z.string().min(1),
  acceptedPlan: z.array(z.string()),
  decisions: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      rationale: z.string().min(1),
    }),
  ),
  importantFindings: z.array(z.string()),
  artifacts: z.array(z.string()),
  unresolved: z.array(z.string()),
});

export type SessionSummary = z.infer<typeof SessionSummarySchema>;
