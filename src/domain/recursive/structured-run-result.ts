import { z } from "zod";

export const recursiveRunOutcomeSchema = z.enum(["success", "failure", "rejection", "interrupted", "degraded"]);

export const recursiveStructuredRunResultSchema = z.object({
  runId: z.string().min(1),
  outcome: recursiveRunOutcomeSchema,
  findings: z.array(z.string()),
  warnings: z.array(z.string()),
  artifactsRead: z.array(z.string()),
  artifactsWritten: z.array(z.string()),
  diagnostics: z.array(z.string()),
  completedAt: z.string().min(1)
});

export type RecursiveRunOutcome = z.infer<typeof recursiveRunOutcomeSchema>;
export type RecursiveStructuredRunResult = z.infer<typeof recursiveStructuredRunResultSchema>;

export function parseRecursiveStructuredRunResult(value: unknown): RecursiveStructuredRunResult {
  return recursiveStructuredRunResultSchema.parse(value);
}
