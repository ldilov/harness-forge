import { z } from "zod";

export const WatchdogSignalSchema = z.enum([
  "agent.looping",
  "agent.tool_failure_repeated",
  "agent.verification_missing",
  "agent.claim_without_evidence",
  "agent.budget_burn_high",
  "agent.risk_escalation",
  "agent.context_pressure_high",
  "agent.side_effect_unverified",
]);
export type WatchdogSignal = z.infer<typeof WatchdogSignalSchema>;

export const InterventionStepSchema = z.enum([
  "observe",
  "warn",
  "constrain",
  "pause",
  "require_approval",
  "terminate",
  "rollback",
]);
export type InterventionStep = z.infer<typeof InterventionStepSchema>;

export const INTERVENTION_STEP_ORDER: readonly InterventionStep[] = [
  "observe",
  "warn",
  "constrain",
  "pause",
  "require_approval",
  "terminate",
  "rollback",
];

export function nextInterventionStep(current: InterventionStep): InterventionStep | null {
  const idx = INTERVENTION_STEP_ORDER.indexOf(current);
  if (idx < 0 || idx >= INTERVENTION_STEP_ORDER.length - 1) {
    return null;
  }
  return INTERVENTION_STEP_ORDER[idx + 1] ?? null;
}

export function interventionRank(step: InterventionStep): number {
  const idx = INTERVENTION_STEP_ORDER.indexOf(step);
  return idx < 0 ? -1 : idx;
}

export function maxInterventionStep(a: InterventionStep, b: InterventionStep): InterventionStep {
  return interventionRank(a) >= interventionRank(b) ? a : b;
}

export const WatchdogInterventionRecordSchema = z
  .object({
    id: z.string().min(1),
    runId: z.string().min(1),
    signal: WatchdogSignalSchema,
    step: InterventionStepSchema,
    reason: z.string().min(1),
    actor: z.string().min(1),
    createdAt: z.string().min(1),
    detail: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type WatchdogInterventionRecord = z.infer<typeof WatchdogInterventionRecordSchema>;

export type AgentRunStatus = "active" | "paused" | "terminated";

export const AgentRunStateSchema = z
  .object({
    runId: z.string().min(1),
    status: z.enum(["active", "paused", "terminated"]),
    interventionStep: InterventionStepSchema,
    interventionCount: z.number().int().nonnegative(),
    pausedAt: z.string().nullable(),
    pausedReason: z.string().nullable(),
    pausedBy: z.string().nullable(),
    lastInterventionAt: z.string().nullable(),
    lastSignal: WatchdogSignalSchema.nullable(),
    updatedAt: z.string().min(1),
  })
  .strict();
export type AgentRunState = z.infer<typeof AgentRunStateSchema>;
