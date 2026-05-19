import { z } from "zod";

export const SideEffectKindSchema = z.enum([
  "file_write",
  "branch_create",
  "worktree_create",
  "worktree_remove",
  "issue_create",
  "comment_create",
  "pr_create",
  "command_execute",
  "config_update",
]);
export type SideEffectKind = z.infer<typeof SideEffectKindSchema>;

export const SideEffectSchema = z
  .object({
    id: z.string().min(1),
    actionPlanId: z.string().min(1),
    kind: SideEffectKindSchema,
    target: z.string().min(1),
    beforeHash: z.string().nullable().optional(),
    afterHash: z.string().nullable().optional(),
    reversible: z.boolean(),
    rollbackCommand: z.string().nullable().optional(),
    detail: z.record(z.string(), z.unknown()).optional(),
    createdAt: z.string().min(1),
  })
  .strict();
export type SideEffect = z.infer<typeof SideEffectSchema>;
