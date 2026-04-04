import { z } from "zod";

export const rolloutStageRecordSchema = z.object({
  stageId: z.string().min(1),
  stageName: z.string().min(1),
  entryCriteria: z.array(z.string().min(1)).default([]),
  exitCriteria: z.array(z.string().min(1)).default([]),
  status: z.enum(["pending", "active", "complete", "blocked"])
});

export const ciGateResultSchema = z.object({
  gateId: z.string().min(1),
  status: z.enum(["pass", "warn", "fail"]),
  metricValue: z.number().optional(),
  threshold: z.number().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  recommendedRemediation: z.string().optional()
});

export type RolloutStageRecord = z.infer<typeof rolloutStageRecordSchema>;
export type CIGateResult = z.infer<typeof ciGateResultSchema>;

export function parseRolloutStageRecord(value: unknown): RolloutStageRecord {
  return rolloutStageRecordSchema.parse(value);
}

export function parseCIGateResult(value: unknown): CIGateResult {
  return ciGateResultSchema.parse(value);
}
