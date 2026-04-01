import { z } from "zod";

export const recursiveIterationStatusSchema = z.enum(["success", "partial", "blocked", "failed", "interrupted"]);

export const recursiveRootExecutionFrameSchema = z.object({
  frameId: z.string().min(1),
  sessionId: z.string().min(1),
  objectiveSummary: z.string().min(1),
  budgetView: z.object({
    policyId: z.string().min(1),
    remainingIterations: z.number().int().min(0),
    remainingSubcalls: z.number().int().min(0),
    remainingCodeCells: z.number().int().min(0),
    stopConditions: z.array(z.string().min(1)).default([])
  }),
  capabilitySummary: z.string().min(1),
  handleInventory: z.array(z.string().min(1)).default([]),
  checkpointSummary: z.array(z.string().min(1)).default([]),
  confirmedFacts: z.array(z.string().min(1)).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  allowedOperations: z.array(z.string().min(1)).default([]),
  finalizationContract: z.array(z.string().min(1)).default([])
});

export const recursiveIterationSchema = z.object({
  iterationId: z.string().min(1),
  sessionId: z.string().min(1),
  sequenceNumber: z.number().int().positive(),
  frameRef: z.string().min(1),
  actionBundleRef: z.string().min(1),
  intent: z.string().min(1),
  resultSummary: z.string().min(1),
  status: recursiveIterationStatusSchema,
  operationsExecuted: z.array(z.string().min(1)).default([]),
  diagnostics: z.array(z.string().min(1)).default([]),
  artifactsProduced: z.array(z.string().min(1)).default([]),
  startedAt: z.string().min(1),
  completedAt: z.string().min(1).optional()
});

export type RecursiveIterationStatus = z.infer<typeof recursiveIterationStatusSchema>;
export type RecursiveRootExecutionFrame = z.infer<typeof recursiveRootExecutionFrameSchema>;
export type RecursiveIteration = z.infer<typeof recursiveIterationSchema>;

export function parseRecursiveIteration(value: unknown): RecursiveIteration {
  return recursiveIterationSchema.parse(value);
}

export function parseRecursiveRootExecutionFrame(value: unknown): RecursiveRootExecutionFrame {
  return recursiveRootExecutionFrameSchema.parse(value);
}
