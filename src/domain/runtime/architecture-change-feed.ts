import { z } from "zod";

import { decisionHealthSeveritySchema } from "./decision-health.js";

export const architectureChangeFeedEventTypeSchema = z.enum([
  "decision-created",
  "decision-updated",
  "decision-status-changed",
  "task-linked",
  "impact-analysis-linked",
  "review-status-changed",
  "health-finding-created",
  "coverage-classified"
]);

export const architectureChangeFeedEntrySchema = z.object({
  id: z.string().min(1),
  occurredAt: z.string().min(1),
  eventType: architectureChangeFeedEventTypeSchema,
  decisionIds: z.array(z.string().min(1)).default([]),
  taskIds: z.array(z.string().min(1)).default([]),
  severity: decisionHealthSeveritySchema.optional(),
  summary: z.string().min(1),
  evidence: z.array(z.string().min(1)).default([])
});

export type ArchitectureChangeFeedEventType = z.infer<typeof architectureChangeFeedEventTypeSchema>;
export type ArchitectureChangeFeedEntry = z.infer<typeof architectureChangeFeedEntrySchema>;

export function parseArchitectureChangeFeedEntry(value: unknown): ArchitectureChangeFeedEntry {
  return architectureChangeFeedEntrySchema.parse(value);
}
