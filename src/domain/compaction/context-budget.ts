import { z } from 'zod';

export const ContextBudgetSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  model: z.object({
    name: z.string().default('unknown-or-provider-specific'),
    contextWindowTokens: z.number().default(200000),
  }),
  budgets: z.object({
    maxHotPathInputTokens: z.number().default(120000),
    reservedOutputTokens: z.number().default(12000),
    reservedToolTokens: z.number().default(8000),
    reservedSafetyMargin: z.number().default(10000),
  }),
  thresholds: z.object({
    evaluateAt: z.number().default(0.70),
    trimAt: z.number().default(0.80),
    summarizeAt: z.number().default(0.88),
    rollupAt: z.number().default(0.93),
    rolloverAt: z.number().default(0.96),
  }),
  current: z.object({
    estimatedInputTokens: z.number().default(0),
    estimatedOutputNeed: z.number().default(0),
    state: z.enum(['none', 'evaluate', 'trim', 'summarize', 'rollup', 'rollover']).default('none'),
  }),
});

export type ContextBudget = z.infer<typeof ContextBudgetSchema>;
