import { z } from "zod";

export const AuthorityLevelSchema = z.enum(["A0", "A1", "A2", "A3", "A4", "A5"]);
export type AuthorityLevel = z.infer<typeof AuthorityLevelSchema>;

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

export const ActionStatusSchema = z.enum([
  "proposed",
  "approved",
  "running",
  "verifying",
  "completed",
  "failed",
  "reverted",
  "rejected",
]);
export type ActionStatus = z.infer<typeof ActionStatusSchema>;

export const ActionStepSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("create_worktree"), branchName: z.string().optional() }).strict(),
  z
    .object({
      type: z.literal("run_command"),
      command: z.string().min(1),
      timeoutMs: z.number().int().positive().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("invoke_agent"),
      goal: z.string().min(1),
      profile: z.string().optional(),
    })
    .strict(),
  z
    .object({
      type: z.literal("write_file"),
      path: z.string().min(1),
      contentRef: z.string().min(1),
    })
    .strict(),
  z.object({ type: z.literal("apply_patch"), patchRef: z.string().min(1) }).strict(),
  z
    .object({
      type: z.literal("open_issue"),
      title: z.string().min(1),
      bodyRef: z.string().min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal("open_pr"),
      title: z.string().min(1),
      bodyRef: z.string().min(1),
      base: z.string().optional(),
    })
    .strict(),
  z.object({ type: z.literal("notify_dashboard") }).strict(),
]);
export type ActionStep = z.infer<typeof ActionStepSchema>;

export const RiskAssessmentSchema = z
  .object({
    level: RiskLevelSchema,
    reasons: z.array(z.string()).default([]),
    touchedTargets: z.array(z.string()).default([]),
    reversible: z.boolean(),
    requiresHumanApproval: z.boolean(),
  })
  .strict();
export type RiskAssessment = z.infer<typeof RiskAssessmentSchema>;

export const VerificationCheckSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("command"),
      command: z.string().min(1),
      timeoutMs: z.number().int().positive().optional(),
    })
    .strict(),
  z.object({ type: z.literal("file_exists"), path: z.string().min(1) }).strict(),
  z
    .object({
      type: z.literal("no_diff_outside"),
      allowedPaths: z.array(z.string()).min(1),
    })
    .strict(),
  z
    .object({
      type: z.literal("schema_valid"),
      path: z.string().min(1),
      schemaRef: z.string().min(1),
    })
    .strict(),
  z.object({ type: z.literal("agent_review"), goal: z.string().min(1) }).strict(),
]);
export type VerificationCheck = z.infer<typeof VerificationCheckSchema>;

export const VerificationSpecSchema = z
  .object({
    required: z.array(VerificationCheckSchema).min(1),
    optional: z.array(VerificationCheckSchema).optional(),
  })
  .strict();
export type VerificationSpec = z.infer<typeof VerificationSpecSchema>;

export const RollbackStrategySchema = z.enum([
  "delete_worktree",
  "reverse_patch",
  "restore_snapshot",
  "manual",
]);
export type RollbackStrategy = z.infer<typeof RollbackStrategySchema>;

export const RollbackSpecSchema = z
  .object({
    strategy: RollbackStrategySchema,
    commands: z.array(z.string()).optional(),
    notes: z.string().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.strategy === "manual" && (value.notes === undefined || value.notes.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "manual rollback requires non-empty notes",
        path: ["notes"],
      });
    }
  });
export type RollbackSpec = z.infer<typeof RollbackSpecSchema>;

export const ActionPlanSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    reason: z.string().min(1),
    sourceSignalIds: z.array(z.string()).min(1),
    proposedBy: z.enum(["monitor", "agent", "user", "scheduler"]),
    authorityRequired: AuthorityLevelSchema,
    status: ActionStatusSchema,
    dryRun: z.boolean().default(false),
    intentTags: z.array(z.string()).default([]),
    risk: RiskAssessmentSchema,
    steps: z.array(ActionStepSchema).min(1),
    verification: VerificationSpecSchema,
    rollback: RollbackSpecSchema.optional(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    const requiresRollback =
      value.risk.level !== "low" && hasLocalMutation(value.steps);
    if (requiresRollback && value.rollback === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "rollback spec required for medium+ risk plans with local mutations",
        path: ["rollback"],
      });
    }
  });
export type ActionPlan = z.infer<typeof ActionPlanSchema>;

const LOCAL_MUTATION_TYPES: ReadonlySet<ActionStep["type"]> = new Set([
  "write_file",
  "apply_patch",
  "create_worktree",
]);

function hasLocalMutation(steps: readonly ActionStep[]): boolean {
  return steps.some((step) => LOCAL_MUTATION_TYPES.has(step.type));
}
