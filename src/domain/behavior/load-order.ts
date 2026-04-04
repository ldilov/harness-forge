import { z } from 'zod';

export const LoadOrderSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  resumeOrder: z.array(z.string().min(1)).default([
    'AGENTS.md',
    'memory.md',
    '.hforge/runtime/active-context.json',
    '.hforge/runtime/session-summary.json',
  ]),
  conflictPolicy: z.enum(['runtime_wins', 'memory_wins']).default('runtime_wins'),
  historyPolicy: z.enum(['deny_by_default', 'allow_by_default']).default('deny_by_default'),
});

export type LoadOrder = z.infer<typeof LoadOrderSchema>;
