import { z } from "zod";

export const recursiveWorkingMemorySchema = z.object({
  memoryId: z.string().min(1),
  sessionId: z.string().min(1),
  taskId: z.string().min(1).optional(),
  currentObjective: z.string().min(1),
  currentPlan: z.array(z.string().min(1)).default([]),
  filesInFocus: z.array(z.string().min(1)).default([]),
  confirmedFacts: z.array(z.string().min(1)).default([]),
  inferredFacts: z.array(z.string().min(1)).default([]),
  blockers: z.array(z.string().min(1)).default([]),
  openQuestions: z.array(z.string().min(1)).default([]),
  recentFailedAttempts: z.array(z.string().min(1)).default([]),
  scratchRefs: z.array(z.string().min(1)).default([]),
  nextStep: z.string().min(1),
  lastBestResult: z.string().min(1).optional(),
  updatedAt: z.string().min(1)
});

export const recursiveScratchRecordSchema = z.object({
  sessionId: z.string().min(1),
  updatedAt: z.string().min(1),
  notes: z.array(z.string().min(1)).default([])
});

export type RecursiveWorkingMemory = z.infer<typeof recursiveWorkingMemorySchema>;
export type RecursiveScratchRecord = z.infer<typeof recursiveScratchRecordSchema>;

export function parseRecursiveWorkingMemory(value: unknown): RecursiveWorkingMemory {
  return recursiveWorkingMemorySchema.parse(value);
}

export function parseRecursiveScratchRecord(value: unknown): RecursiveScratchRecord {
  return recursiveScratchRecordSchema.parse(value);
}
