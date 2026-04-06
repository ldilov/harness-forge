import { z } from 'zod';

export const TraceMetricsSchema = z.object({
  tokensUsed: z.number().int().nonnegative(),
  tokenBudget: z.number().int().positive(),
  compactionsTriggered: z.number().int().nonnegative(),
  compactionStrategies: z.array(z.string()).default([]),
  tokensSaved: z.number().int().nonnegative(),
  subagentsSpawned: z.number().int().nonnegative(),
  duplicatesSuppressed: z.number().int().nonnegative(),
  skillsInvoked: z.array(z.string()).default([]),
  commandsRun: z.array(z.string()).default([]),
  errorsEncountered: z.number().int().nonnegative(),
});

export type TraceMetrics = z.infer<typeof TraceMetricsSchema>;

export const TraceOutcomeSchema = z.object({
  taskCompleted: z.boolean(),
  retries: z.number().int().nonnegative(),
  userCorrections: z.number().int().nonnegative(),
  budgetExceeded: z.boolean(),
});

export type TraceOutcome = z.infer<typeof TraceOutcomeSchema>;

export const SessionTraceSchema = z.object({
  traceId: z.string(),
  sessionId: z.string(),
  target: z.string(),
  repo: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  durationSeconds: z.number().nonnegative(),
  metrics: TraceMetricsSchema,
  outcome: TraceOutcomeSchema,
});

export type SessionTrace = z.infer<typeof SessionTraceSchema>;
