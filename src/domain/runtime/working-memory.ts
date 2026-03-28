import { z } from "zod";

export const workingMemorySchema = z.object({
  taskId: z.string().min(1),
  currentObjective: z.string().min(1),
  currentPlan: z.array(z.string().min(1)).default([]),
  filesInFocus: z.array(z.string().min(1)).default([]),
  confirmedFacts: z.array(z.string().min(1)).default([]),
  inferredFacts: z.array(z.string().min(1)).default([]),
  openQuestions: z.array(z.string().min(1)).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  recentFailedAttempts: z.array(z.string().min(1)).default([]),
  nextStep: z.string().min(1),
  lastUpdated: z.string().min(1),
  compactedFromVersion: z.number().int().nonnegative().optional()
});

export type WorkingMemory = z.infer<typeof workingMemorySchema>;

export function parseWorkingMemory(value: unknown): WorkingMemory {
  return workingMemorySchema.parse(value);
}
