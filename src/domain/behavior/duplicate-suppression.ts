import { z } from 'zod';

export const ContextSourceTypeSchema = z.enum(['bridge', 'wrapper', 'runtime']);

export const SurvivingSourceSchema = z.object({
  path: z.string().min(1),
  type: ContextSourceTypeSchema,
});

export const SuppressedSourceSchema = z.object({
  path: z.string().min(1),
  type: z.string().min(1),
  reason: z.string().min(1),
});

export const DuplicateSuppressionResultSchema = z.object({
  totalSources: z.number().int().min(0),
  suppressedCount: z.number().int().min(0),
  survivingSources: z.array(SurvivingSourceSchema),
  suppressedSources: z.array(SuppressedSourceSchema),
});

export type DuplicateSuppressionResult = z.infer<typeof DuplicateSuppressionResultSchema>;
