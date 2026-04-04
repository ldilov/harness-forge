import { z } from "zod";

export const signalTypeSchema = z.enum([
  "target-marker",
  "language-signal",
  "framework-signal",
  "tooling-signal",
  "runtime-signal",
  "capability-truth",
  "maintenance-signal",
  "task-signal",
  "flow-signal",
]);

export type SignalType = z.infer<typeof signalTypeSchema>;

export const evidenceItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  path: z.string().optional(),
  signalType: signalTypeSchema,
  summary: z.string().min(1).max(120),
  confidence: z.number().min(0).max(1).optional(),
});

export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

export function parseEvidenceItem(value: unknown): EvidenceItem {
  return evidenceItemSchema.parse(value);
}

export const languageStrengthSchema = z.enum(["high", "medium", "low"]);

export const languageSignalSchema = z.object({
  language: z.string().min(1),
  strength: languageStrengthSchema,
});

export type LanguageSignal = z.infer<typeof languageSignalSchema>;

export function parseLanguageSignal(value: unknown): LanguageSignal {
  return languageSignalSchema.parse(value);
}
