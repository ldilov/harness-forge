import { z } from "zod";

export const recursiveSessionOutcomeSchema = z.enum(["completed", "partial", "blocked", "failed", "draft"]);

export const recursiveSessionSummarySchema = z.object({
  sessionId: z.string().min(1),
  taskId: z.string().min(1).optional(),
  outcome: recursiveSessionOutcomeSchema,
  summary: z.string().min(1),
  promotedArtifacts: z.array(z.string().min(1)).default([]),
  outstandingGaps: z.array(z.string().min(1)).default([]),
  budgetReport: z.object({
    policyId: z.string().min(1),
    limitsHit: z.array(z.string().min(1)).default([]),
    notes: z.string().min(1).optional()
  }),
  followUp: z.string().min(1),
  generatedAt: z.string().min(1),
  latestIterationRef: z.string().min(1).optional(),
  latestCheckpointRef: z.string().min(1).optional(),
  finalOutputRef: z.string().min(1).optional(),
  scorecardRef: z.string().min(1).optional()
});

export type RecursiveSessionSummary = z.infer<typeof recursiveSessionSummarySchema>;

export function parseRecursiveSessionSummary(value: unknown): RecursiveSessionSummary {
  return recursiveSessionSummarySchema.parse(value);
}
