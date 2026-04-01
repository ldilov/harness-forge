import { z } from "zod";

export const recursiveExecutionIsolationLevelSchema = z.enum([
  "metadata-only",
  "read-only-inspection",
  "read-only-repl",
  "isolated-execution"
]);
export const recursivePolicyLevelSchema = z.enum([
  "metadata-only",
  "read-only",
  "typed-rlm",
  "bounded-code",
  "ai-layer-proposal",
  "product-proposal"
]);

export const recursiveExecutionPolicySchema = z.object({
  policyId: z.string().min(1),
  sessionId: z.string().min(1),
  isolationLevel: recursiveExecutionIsolationLevelSchema,
  policyLevel: recursivePolicyLevelSchema.default("typed-rlm"),
  allowStructuredRun: z.boolean(),
  allowTypedActions: z.boolean().default(true),
  allowCodeCells: z.boolean().default(false),
  allowMetaOps: z.boolean().default(false),
  allowPromotions: z.boolean().default(true),
  allowedInputs: z.array(z.string().min(1)),
  restrictedBehaviors: z.array(z.string().min(1)),
  allowedOperationFamilies: z.array(z.string().min(1)).default([]),
  allowedLanguages: z.array(z.string().min(1)).default([]),
  allowedWriteScopes: z.array(z.string().min(1)).default([]),
  networkPosture: z.string().min(1).default("offline"),
  stopConditions: z.array(z.string().min(1)).default([]),
  budgetSummary: z.object({
    maxDurationMs: z.number().int().positive(),
    maxRuns: z.number().int().positive(),
    maxIterations: z.number().int().positive().default(1),
    maxSubcalls: z.number().int().nonnegative().default(0),
    maxCodeCells: z.number().int().nonnegative().default(0),
    notes: z.string().min(1)
  }),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export type RecursiveExecutionIsolationLevel = z.infer<typeof recursiveExecutionIsolationLevelSchema>;
export type RecursivePolicyLevel = z.infer<typeof recursivePolicyLevelSchema>;
export type RecursiveExecutionPolicy = z.infer<typeof recursiveExecutionPolicySchema>;

export function parseRecursiveExecutionPolicy(value: unknown): RecursiveExecutionPolicy {
  return recursiveExecutionPolicySchema.parse(value);
}
