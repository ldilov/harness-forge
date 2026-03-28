import { z } from "zod";

export const recursiveExecutionIsolationLevelSchema = z.enum([
  "metadata-only",
  "read-only-inspection",
  "read-only-repl",
  "isolated-execution"
]);

export const recursiveExecutionPolicySchema = z.object({
  policyId: z.string().min(1),
  sessionId: z.string().min(1),
  isolationLevel: recursiveExecutionIsolationLevelSchema,
  allowStructuredRun: z.boolean(),
  allowedInputs: z.array(z.string().min(1)),
  restrictedBehaviors: z.array(z.string().min(1)),
  budgetSummary: z.object({
    maxDurationMs: z.number().int().positive(),
    maxRuns: z.number().int().positive(),
    notes: z.string().min(1)
  }),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export type RecursiveExecutionIsolationLevel = z.infer<typeof recursiveExecutionIsolationLevelSchema>;
export type RecursiveExecutionPolicy = z.infer<typeof recursiveExecutionPolicySchema>;

export function parseRecursiveExecutionPolicy(value: unknown): RecursiveExecutionPolicy {
  return recursiveExecutionPolicySchema.parse(value);
}
