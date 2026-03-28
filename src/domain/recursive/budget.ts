import { z } from "zod";

export const recursiveSandboxModeSchema = z.enum(["disabled", "restricted", "isolated"]);
export const recursiveIsolationLevelSchema = z.enum([
  "metadata-only",
  "read-only-inspection",
  "read-only-repl",
  "isolated-execution"
]);

export const recursiveBudgetPolicySchema = z.object({
  policyId: z.string().min(1),
  maxDepth: z.number().int().min(0),
  maxIterations: z.number().int().min(1),
  maxSubcalls: z.number().int().min(0),
  maxBatchWidth: z.number().int().min(1),
  maxDurationMs: z.number().int().min(1),
  maxTokensApprox: z.number().int().min(1).optional(),
  maxToolReads: z.number().int().min(1),
  allowWritesToScratchOnly: z.boolean(),
  allowNetwork: z.boolean(),
  sandboxMode: recursiveSandboxModeSchema,
  isolationLevel: recursiveIsolationLevelSchema
});

export type RecursiveBudgetPolicy = z.infer<typeof recursiveBudgetPolicySchema>;

export function parseRecursiveBudgetPolicy(value: unknown): RecursiveBudgetPolicy {
  return recursiveBudgetPolicySchema.parse(value);
}

export function createDefaultRecursiveBudgetPolicy(): RecursiveBudgetPolicy {
  return {
    policyId: "default-recursive-policy",
    maxDepth: 2,
    maxIterations: 6,
    maxSubcalls: 12,
    maxBatchWidth: 4,
    maxDurationMs: 300000,
    maxToolReads: 40,
    allowWritesToScratchOnly: true,
    allowNetwork: false,
    sandboxMode: "disabled",
    isolationLevel: "read-only-inspection"
  };
}
