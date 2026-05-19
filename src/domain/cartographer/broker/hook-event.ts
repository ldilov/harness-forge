import { z } from "zod";

export const agentHookEventSchema = z.enum([
  "task.started",
  "task.context_needed",
  "files.pre_edit",
  "files.changed",
  "command.started",
  "command.completed",
  "command.failed",
  "tests.failed",
  "refactor.started",
  "refactor.step_completed",
  "docs.changed",
  "pr.prep",
  "task.completed",
]);

export const autonomyLevelSchema = z.enum([
  "manual",
  "diagnostic",
  "developer",
  "autonomous-local",
]);

export const agentHookPayloadSchema = z.object({
  event: agentHookEventSchema,
  goal: z.string().max(4096).optional(),
  files: z.array(z.string().min(1).max(4096)).max(500).default([]),
  command: z.string().max(4096).optional(),
  logPath: z.string().max(4096).optional(),
});

export type AgentHookEvent = z.infer<typeof agentHookEventSchema>;
export type AutonomyLevel = z.infer<typeof autonomyLevelSchema>;
export type AgentHookPayload = z.infer<typeof agentHookPayloadSchema>;

const AUTONOMY_RANK: Readonly<Record<AutonomyLevel, number>> = {
  manual: 0,
  diagnostic: 1,
  developer: 2,
  "autonomous-local": 3,
};

export function autonomyAllows(level: AutonomyLevel, required: AutonomyLevel): boolean {
  return AUTONOMY_RANK[level] >= AUTONOMY_RANK[required];
}
