import { z } from "zod";

export const recursiveTraceEventTypeSchema = z.enum([
  "tool-call",
  "batch-start",
  "batch-end",
  "subcall",
  "iteration",
  "action-bundle",
  "code-cell",
  "checkpoint",
  "promotion",
  "meta-op",
  "scorecard",
  "budget-breach",
  "compact",
  "finalize",
  "resume"
]);
export const recursiveTraceActorSchema = z.enum(["runtime", "operator", "child-session"]);
export const recursiveTraceStatusSchema = z.enum(["success", "partial", "blocked", "failed"]);

export const recursiveTraceEventSchema = z.object({
  eventId: z.string().min(1),
  sessionId: z.string().min(1),
  eventType: recursiveTraceEventTypeSchema,
  occurredAt: z.string().min(1),
  actor: recursiveTraceActorSchema,
  inputRefs: z.array(z.string().min(1)).default([]),
  outputRefs: z.array(z.string().min(1)).default([]),
  status: recursiveTraceStatusSchema,
  budgetImpact: z
    .object({
      iterationsUsed: z.number().int().min(0).optional(),
      subcallsUsed: z.number().int().min(0).optional(),
      batchWidthUsed: z.number().int().min(0).optional()
    })
    .optional(),
  notes: z.string().min(1).optional()
});

export type RecursiveTraceEvent = z.infer<typeof recursiveTraceEventSchema>;

export function parseRecursiveTraceEvent(value: unknown): RecursiveTraceEvent {
  return recursiveTraceEventSchema.parse(value);
}
