import { z } from "zod";

export const signalCategorySchema = z.enum([
  "install", "firstRun", "guidance", "runtimeUsage", "maintenance",
  "recursive", "handoff", "outcomes", "heuristics"
]);

export const confidenceLevelSchema = z.enum([
  "direct", "inferred-high", "inferred-medium", "inferred-low"
]);

export const effectivenessSignalV2Schema = z.object({
  signalType: z.string().min(1),
  subjectId: z.string().min(1),
  context: z.string().optional(),
  result: z.enum(["success", "skipped", "failed", "accepted", "rejected"]),
  recordedAt: z.string().min(1),
  details: z.record(z.unknown()).optional(),
  category: signalCategorySchema.optional(),
  confidenceLevel: confidenceLevelSchema.optional()
});

export type SignalCategory = z.infer<typeof signalCategorySchema>;
export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
export type EffectivenessSignalV2 = z.infer<typeof effectivenessSignalV2Schema>;

export function parseEffectivenessSignalV2(value: unknown): EffectivenessSignalV2 {
  return effectivenessSignalV2Schema.parse(value);
}
