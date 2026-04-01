import { z } from "zod";

import { recursiveModelTierSchema, recursiveSubcallTypeSchema } from "./action-bundle.js";

export const recursiveSubcallStatusSchema = z.enum(["pending", "running", "completed", "failed", "blocked"]);

export const recursiveSubcallSchema = z.object({
  subcallId: z.string().min(1),
  sessionId: z.string().min(1),
  parentIterationId: z.string().min(1),
  subcallType: recursiveSubcallTypeSchema,
  inputRefs: z.array(z.string().min(1)).default([]),
  routingTier: recursiveModelTierSchema,
  status: recursiveSubcallStatusSchema,
  prompt: z.string().min(1),
  summary: z.string().min(1).optional(),
  resultRef: z.string().min(1).optional(),
  budgetOverride: z
    .object({
      maxIterations: z.number().int().positive().optional(),
      maxDurationMs: z.number().int().positive().optional()
    })
    .optional(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1)
});

export type RecursiveSubcallStatus = z.infer<typeof recursiveSubcallStatusSchema>;
export type RecursiveSubcall = z.infer<typeof recursiveSubcallSchema>;

export function parseRecursiveSubcall(value: unknown): RecursiveSubcall {
  return recursiveSubcallSchema.parse(value);
}
