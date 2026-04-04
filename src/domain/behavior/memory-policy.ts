import { z } from 'zod';

import { ALLOWED_SECTIONS, FORBIDDEN_PATTERNS, SIZE_BUDGET } from '../compaction/memory/memory-content-rules.js';

export const RotationPolicySchema = z.object({
  onHardCap: z.enum(['rotate', 'warn']).default('rotate'),
  onMilestone: z.enum(['summarize', 'skip']).default('summarize'),
});

export const MemoryPolicySchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  targetWords: z.object({
    min: z.number().int().min(0).default(SIZE_BUDGET.targetMinWords),
    max: z.number().int().min(0).default(SIZE_BUDGET.targetMaxWords),
  }).default({}),
  hardCapTokens: z.number().int().min(0).default(SIZE_BUDGET.hardCapTokens),
  allowedSections: z.array(z.string().min(1)).default([...ALLOWED_SECTIONS]),
  forbiddenContent: z.array(z.string().min(1)).default([...FORBIDDEN_PATTERNS]),
  rotationPolicy: RotationPolicySchema.default({}),
});

export type MemoryPolicy = z.infer<typeof MemoryPolicySchema>;
