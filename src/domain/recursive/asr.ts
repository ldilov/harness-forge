import { z } from "zod";

import { reviewStatusSchema } from "../runtime/file-interest.js";

export const recursiveAsrRecordSchema = z.object({
  asrId: z.string().min(1),
  taskId: z.string().min(1),
  title: z.string().min(1),
  requirement: z.string().min(1),
  significanceReasons: z.array(z.string().min(1)).default([]),
  impactedModules: z.array(z.string().min(1)).default([]),
  constraints: z.array(z.string().min(1)).default([]),
  risks: z.array(z.string().min(1)).default([]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  status: reviewStatusSchema,
  linkedDecisionRefs: z.array(z.string().min(1)).default([])
});

export type RecursiveAsrRecord = z.infer<typeof recursiveAsrRecordSchema>;

export function parseRecursiveAsrRecord(value: unknown): RecursiveAsrRecord {
  return recursiveAsrRecordSchema.parse(value);
}
