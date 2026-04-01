import { z } from "zod";

export const recursiveCheckpointSchema = z.object({
  checkpointId: z.string().min(1),
  sessionId: z.string().min(1),
  iterationId: z.string().min(1),
  summary: z.string().min(1),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  reason: z.string().min(1),
  createdAt: z.string().min(1)
});

export type RecursiveCheckpoint = z.infer<typeof recursiveCheckpointSchema>;

export function parseRecursiveCheckpoint(value: unknown): RecursiveCheckpoint {
  return recursiveCheckpointSchema.parse(value);
}
