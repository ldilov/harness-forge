import { z } from "zod";

import { recursiveBudgetPolicySchema } from "./budget.js";

export const recursiveSessionStatusSchema = z.enum(["draft", "running", "paused", "finalized", "failed"]);
export const recursivePromotionStateSchema = z.enum(["draft-only", "partially-promoted", "fully-promoted"]);
export const recursiveHandleTypeSchema = z.enum([
  "repo-file",
  "repo-slice",
  "task-artifact",
  "decision-artifact",
  "template",
  "summary",
  "search-result",
  "runtime-artifact",
  "checkpoint",
  "memory",
  "scorecard",
  "final-output"
]);
export const recursiveHandleStalenessSchema = z.enum(["fresh", "unknown", "stale"]);

export const recursiveArtifactHandleSchema = z.object({
  handleId: z.string().min(1),
  handleType: recursiveHandleTypeSchema,
  targetRef: z.string().min(1),
  label: z.string().min(1),
  summary: z.string().min(1),
  stalenessState: recursiveHandleStalenessSchema,
  sourceArtifactType: z.string().min(1).optional()
});

export const recursiveSessionSchema = z.object({
  sessionId: z.string().min(1),
  taskId: z.string().min(1).optional(),
  status: recursiveSessionStatusSchema,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  rootObjective: z.string().min(1).optional(),
  budgetPolicy: recursiveBudgetPolicySchema,
  handles: z.array(recursiveArtifactHandleSchema),
  tools: z.array(z.string().min(1)),
  compactedSummary: z.string().min(1).optional(),
  parentSessionId: z.string().min(1).optional(),
  promotionState: recursivePromotionStateSchema,
  policyRef: z.string().min(1).optional(),
  capabilityViewRef: z.string().min(1).optional(),
  runtimeInventoryRef: z.string().min(1).optional(),
  memoryRef: z.string().min(1).optional(),
  summaryRef: z.string().min(1).optional(),
  finalOutputRef: z.string().min(1).optional(),
  scorecardRef: z.string().min(1).optional(),
  rootFrameRef: z.string().min(1).optional(),
  iterationCount: z.number().int().min(0).default(0),
  subcallCount: z.number().int().min(0).default(0),
  codeCellCount: z.number().int().min(0).default(0),
  checkpointCount: z.number().int().min(0).default(0)
});

export type RecursiveArtifactHandle = z.infer<typeof recursiveArtifactHandleSchema>;
export type RecursiveSessionStatus = z.infer<typeof recursiveSessionStatusSchema>;
export type RecursivePromotionState = z.infer<typeof recursivePromotionStateSchema>;
export type RecursiveSession = z.infer<typeof recursiveSessionSchema>;

export function parseRecursiveSession(value: unknown): RecursiveSession {
  return recursiveSessionSchema.parse(value);
}
