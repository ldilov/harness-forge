import { z } from "zod";

export const recursiveEscalationTriggerSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1)
});

export const recursiveEscalationHeuristicsSchema = z.object({
  version: z.number().int().positive(),
  generatedAt: z.string().min(1),
  summary: z.string().min(1),
  preferredSequence: z.array(z.string().min(1)).min(1),
  operatorHintCommand: z.string().min(1),
  advisoryOnly: z.boolean(),
  triggers: z.array(recursiveEscalationTriggerSchema).min(1),
  nonTriggers: z.array(z.string().min(1)).min(1)
});

export type RecursiveEscalationHeuristics = z.infer<typeof recursiveEscalationHeuristicsSchema>;

export function parseRecursiveEscalationHeuristics(value: unknown): RecursiveEscalationHeuristics {
  return recursiveEscalationHeuristicsSchema.parse(value);
}
