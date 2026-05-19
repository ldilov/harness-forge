import { z } from "zod";

import { agentHookEventSchema } from "./hook-event.js";

export const HOOK_RUN_SCHEMA_VERSION = 1;

export const commandExecutorSchema = z.enum([
  "graph-build",
  "context-compile",
  "impact",
  "none",
]);

export const agentCommandRecommendationSchema = z.object({
  id: z.string().min(1),
  command: z.string().min(1),
  reason: z.string().min(1),
  autoExecutable: z.boolean(),
  priority: z.number().int().nonnegative(),
  requiredAutonomy: z.enum(["manual", "diagnostic", "developer", "autonomous-local"]),
  executor: commandExecutorSchema,
});

export const agentCommandResultSchema = z.object({
  command: z.string().min(1),
  status: z.enum(["ok", "error", "skipped"]),
  detail: z.string().min(1),
  artifactId: z.string().optional(),
});

export const agentNextActionSchema = z.object({
  kind: z.enum(["read-bundle", "review-impact", "run-commands", "none"]),
  hint: z.string().min(1),
});

export const agentHookRunSchema = z.object({
  schemaVersion: z.literal(HOOK_RUN_SCHEMA_VERSION),
  id: z.string().min(1),
  createdAt: z.string().min(1),
  event: agentHookEventSchema,
  goal: z.string().optional(),
  files: z.array(z.string().min(1)).default([]),
  command: z.string().optional(),
  logPath: z.string().optional(),
  mode: z.enum(["dry-run", "execute"]),
  autonomyLevel: z.enum(["manual", "diagnostic", "developer", "autonomous-local"]),
  fingerprint: z.string().min(1),
  cached: z.boolean(),
  status: z.enum(["ok", "warning", "blocked"]),
  recommendedCommands: z.array(agentCommandRecommendationSchema).default([]),
  executedCommands: z.array(agentCommandResultSchema).default([]),
  contextBundleId: z.string().optional(),
  impactAnalysisId: z.string().optional(),
  decisionRefs: z.array(z.string().min(1)).default([]),
  nextAction: agentNextActionSchema,
  notes: z.array(z.string().min(1)).default([]),
});

export type CommandExecutor = z.infer<typeof commandExecutorSchema>;
export type AgentCommandRecommendation = z.infer<typeof agentCommandRecommendationSchema>;
export type AgentCommandResult = z.infer<typeof agentCommandResultSchema>;
export type AgentNextAction = z.infer<typeof agentNextActionSchema>;
export type AgentHookRun = z.infer<typeof agentHookRunSchema>;

export function parseAgentHookRun(value: unknown): AgentHookRun {
  return agentHookRunSchema.parse(value);
}
