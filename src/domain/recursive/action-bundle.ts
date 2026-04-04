import { z } from "zod";

export const recursiveModelTierSchema = z.enum(["root", "child", "economy"]);
export const recursiveStopDirectiveSchema = z
  .object({
    kind: z.enum(["continue", "pause", "finalize"]),
    reason: z.string().min(1).optional()
  })
  .optional();

const readHandleActionSchema = z.object({
  actionId: z.string().min(1),
  kind: z.literal("read-handle"),
  args: z.object({
    handleId: z.string().min(1)
  })
});

const updateMemoryActionSchema = z.object({
  actionId: z.string().min(1),
  kind: z.literal("update-memory"),
  args: z.object({
    confirmedFacts: z.array(z.string().min(1)).optional(),
    inferredFacts: z.array(z.string().min(1)).optional(),
    openQuestions: z.array(z.string().min(1)).optional(),
    blockers: z.array(z.string().min(1)).optional(),
    filesInFocus: z.array(z.string().min(1)).optional(),
    currentPlan: z.array(z.string().min(1)).optional(),
    nextStep: z.string().min(1).optional(),
    lastBestResult: z.string().min(1).optional()
  })
});

const checkpointActionSchema = z.object({
  actionId: z.string().min(1),
  kind: z.literal("checkpoint"),
  args: z.object({
    summary: z.string().min(1),
    reason: z.string().min(1),
    evidenceRefs: z.array(z.string().min(1)).default([])
  })
});

export const recursiveSubcallTypeSchema = z.enum([
  "summarize",
  "inspect",
  "classify",
  "compare",
  "verify",
  "generate",
  "reduce",
  "meta-review"
]);

const spawnSubcallActionSchema = z.object({
  actionId: z.string().min(1),
  kind: z.literal("spawn-subcall"),
  args: z.object({
    subcallType: recursiveSubcallTypeSchema,
    prompt: z.string().min(1),
    inputRefs: z.array(z.string().min(1)).default([]),
    routingTier: recursiveModelTierSchema.default("child"),
    summary: z.string().min(1).optional()
  })
});

export const recursiveCodeCellLanguageSchema = z.enum(["javascript", "typescript", "python", "powershell"]);

const runCodeCellActionSchema = z.object({
  actionId: z.string().min(1),
  kind: z.literal("run-code-cell"),
  args: z.object({
    languageId: recursiveCodeCellLanguageSchema,
    inputRefs: z.array(z.string().min(1)).default([]),
    expectedOutputs: z.array(z.string().min(1)).default([]),
    source: z.string().min(1),
    title: z.string().min(1).optional(),
    helper: z
      .object({
        helperId: z.string().min(1).optional(),
        fileName: z.string().min(1).optional(),
        summary: z.string().min(1),
        publishAsReusable: z.boolean().default(true)
      })
      .optional()
  })
});

export const recursivePromotionKindSchema = z.enum([
  "final-output",
  "plan",
  "patch-proposal",
  "review-artifact",
  "instruction-proposal"
]);

const proposePromotionActionSchema = z.object({
  actionId: z.string().min(1),
  kind: z.literal("propose-promotion"),
  args: z.object({
    promotionKind: recursivePromotionKindSchema,
    sourceRefs: z.array(z.string().min(1)).default([]),
    targetSurface: z.string().min(1),
    rationale: z.string().min(1),
    verificationSummary: z.string().min(1).optional()
  })
});

const proposeMetaOpActionSchema = z.object({
  actionId: z.string().min(1),
  kind: z.literal("propose-meta-op"),
  args: z.object({
    targetKind: z.string().min(1),
    targetRef: z.string().min(1),
    rationale: z.string().min(1),
    patchSummary: z.string().min(1)
  })
});

const finalizeOutputActionSchema = z.object({
  actionId: z.string().min(1),
  kind: z.literal("finalize-output"),
  args: z.object({
    summary: z.string().min(1),
    sections: z.array(z.string().min(1)).default([]),
    artifactRefs: z.array(z.string().min(1)).default([]),
    terminalVerdict: z.enum(["completed", "partial", "blocked", "failed"]).default("completed")
  })
});

export const recursiveActionSchema = z.discriminatedUnion("kind", [
  readHandleActionSchema,
  updateMemoryActionSchema,
  checkpointActionSchema,
  spawnSubcallActionSchema,
  runCodeCellActionSchema,
  proposePromotionActionSchema,
  proposeMetaOpActionSchema,
  finalizeOutputActionSchema
]);

export const recursiveActionBundleSchema = z.object({
  bundleId: z.string().min(1),
  sessionId: z.string().min(1),
  iterationId: z.string().min(1),
  intent: z.string().min(1),
  actions: z.array(recursiveActionSchema).min(1),
  stopDirective: recursiveStopDirectiveSchema,
  modelTier: recursiveModelTierSchema,
  createdAt: z.string().min(1)
});

export type RecursiveModelTier = z.infer<typeof recursiveModelTierSchema>;
export type RecursiveAction = z.infer<typeof recursiveActionSchema>;
export type RecursiveActionBundle = z.infer<typeof recursiveActionBundleSchema>;
export type RecursiveSubcallType = z.infer<typeof recursiveSubcallTypeSchema>;
export type RecursivePromotionKind = z.infer<typeof recursivePromotionKindSchema>;
export type RecursiveCodeCellLanguage = z.infer<typeof recursiveCodeCellLanguageSchema>;

export function parseRecursiveActionBundle(value: unknown): RecursiveActionBundle {
  return recursiveActionBundleSchema.parse(value);
}
