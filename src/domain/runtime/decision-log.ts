import { z } from "zod";

import { decisionHealthFindingSchema } from "./decision-health.js";

export const decisionLogGroupingSchema = z.enum(["time-period", "status", "significance"]);

export const decisionLogEntrySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  recordType: z.enum(["asr", "adr"]),
  status: z.string().min(1),
  architectureSignificance: z.string().min(1),
  reviewStatus: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  taskRefs: z.array(z.string().min(1)).default([]),
  supersessionState: z.string().min(1),
  summary: z.string().min(1).optional()
});

export const decisionLogSchema = z.object({
  generatedAt: z.string().min(1),
  grouping: decisionLogGroupingSchema,
  entries: z.array(decisionLogEntrySchema),
  findings: z.array(decisionHealthFindingSchema).default([])
});

export type DecisionLogGrouping = z.infer<typeof decisionLogGroupingSchema>;
export type DecisionLogEntry = z.infer<typeof decisionLogEntrySchema>;
export type DecisionLog = z.infer<typeof decisionLogSchema>;

export function parseDecisionLog(value: unknown): DecisionLog {
  return decisionLogSchema.parse(value);
}
