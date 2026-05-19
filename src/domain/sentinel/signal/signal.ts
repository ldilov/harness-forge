import { z } from "zod";
import { SeveritySchema } from "../monitor/monitor.js";

export const SignalCategorySchema = z.enum([
  "incident",
  "regression",
  "maintenance",
  "security",
  "stale-decision",
  "optimization",
  "agent-health",
  "opportunity",
]);
export type SignalCategory = z.infer<typeof SignalCategorySchema>;

export const SignalStatusSchema = z.enum(["open", "suppressed", "actioned", "resolved"]);
export type SignalStatus = z.infer<typeof SignalStatusSchema>;

export const SignalSchema = z
  .object({
    id: z.string().min(1),
    observationIds: z.array(z.string()).min(1),
    category: SignalCategorySchema,
    title: z.string().min(1),
    summary: z.string().min(1),
    priority: z.number().min(0).max(100),
    severity: SeveritySchema,
    recommendedIntent: z.string().optional(),
    confidence: z.number().min(0).max(1),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
    status: SignalStatusSchema,
    fingerprint: z.string().min(1),
  })
  .strict();
export type Signal = z.infer<typeof SignalSchema>;

export const SuppressionEntrySchema = z
  .object({
    signalId: z.string().min(1),
    reason: z.string().min(1),
    actor: z.string().min(1),
    suppressedAt: z.string().min(1),
    expiresAt: z.string().nullable(),
  })
  .strict();
export type SuppressionEntry = z.infer<typeof SuppressionEntrySchema>;

export const SuppressionIndexSchema = z.record(z.string(), SuppressionEntrySchema);
export type SuppressionIndex = z.infer<typeof SuppressionIndexSchema>;
