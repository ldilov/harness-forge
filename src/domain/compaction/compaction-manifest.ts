import { z } from 'zod';

export const CompactionManifestSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  manifestId: z.string().min(1),
  createdAt: z.string().min(1),
  source: z.object({
    runtimeSessionId: z.string().min(1),
    taskId: z.string().optional(),
    coveredEventRange: z.tuple([z.string(), z.string()]),
  }),
  strategy: z.object({
    level: z.number().int().min(0).max(4),
    reason: z.string().min(1),
    profile: z.string().min(1),
  }),
  stats: z.object({
    estimatedTokensBefore: z.number().int().min(0),
    estimatedTokensAfter: z.number().int().min(0),
    droppedLowImportanceItems: z.number().int().min(0),
    summarizedMediumImportanceItems: z.number().int().min(0),
    preservedCriticalItems: z.number().int().min(0),
  }),
  outputs: z.object({
    sessionSummary: z.string().min(1),
    deltaSummary: z.string().min(1),
    activeContext: z.string().min(1),
  }),
  validation: z.object({
    passed: z.boolean(),
    checks: z.array(z.string()),
  }),
});

export type CompactionManifest = z.infer<typeof CompactionManifestSchema>;
