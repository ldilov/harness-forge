import { z } from 'zod';

export const DeltaSummarySchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  deltaId: z.string().min(1),
  createdAt: z.string().min(1),
  sinceSummaryId: z.string().min(1),
  changes: z.array(z.string()),
  newArtifacts: z.array(z.string()),
  newBlockers: z.array(z.string()),
  status: z.string().min(1),
});

export type DeltaSummary = z.infer<typeof DeltaSummarySchema>;
