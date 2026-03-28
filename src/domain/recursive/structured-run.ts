import { z } from "zod";

export const recursiveRunSubmissionModeSchema = z.enum(["file", "stdin"]);
export const recursiveRunStatusSchema = z.enum([
  "pending",
  "running",
  "success",
  "failure",
  "rejection",
  "interrupted",
  "degraded"
]);

export const recursiveStructuredRunSchema = z.object({
  runId: z.string().min(1),
  sessionId: z.string().min(1),
  submissionMode: recursiveRunSubmissionModeSchema,
  sourceRef: z.string().min(1).optional(),
  status: recursiveRunStatusSchema,
  startedAt: z.string().min(1),
  completedAt: z.string().min(1).optional(),
  policyRef: z.string().min(1),
  resultRef: z.string().min(1).optional(),
  summary: z.string().min(1),
  warningCount: z.number().int().nonnegative().optional(),
  failureReason: z.string().min(1).optional(),
  requestedBehaviors: z.array(z.string().min(1)).optional()
});

export type RecursiveRunSubmissionMode = z.infer<typeof recursiveRunSubmissionModeSchema>;
export type RecursiveRunStatus = z.infer<typeof recursiveRunStatusSchema>;
export type RecursiveStructuredRun = z.infer<typeof recursiveStructuredRunSchema>;

export function parseRecursiveStructuredRun(value: unknown): RecursiveStructuredRun {
  return recursiveStructuredRunSchema.parse(value);
}
