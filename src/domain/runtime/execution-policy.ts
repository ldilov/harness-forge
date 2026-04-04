import { z } from "zod";

export const executionPolicyManifestSchema = z.object({
  policyId: z.string().min(1),
  writableRoots: z.array(z.string().min(1)).min(1),
  allowProductCodeWrites: z.boolean().default(false),
  allowedHelpers: z.array(z.string().min(1)).default([]),
  blockedPatterns: z.array(z.string().min(1)).default([]),
  networkPosture: z.string().min(1)
});

export type ExecutionPolicyManifest = z.infer<typeof executionPolicyManifestSchema>;

export function parseExecutionPolicyManifest(value: unknown): ExecutionPolicyManifest {
  return executionPolicyManifestSchema.parse(value);
}
