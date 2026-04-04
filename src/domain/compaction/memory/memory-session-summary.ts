import { z } from 'zod';

export const MemorySessionSummarySchema = z.object({
  objective: z.string(),
  state: z.array(z.string()),
  decisions: z.array(z.string()),
  constraints: z.array(z.string()),
  blockers: z.array(z.string()),
  nextActions: z.array(z.string()),
  references: z.array(z.string()),
});

export type MemorySessionSummary = z.infer<typeof MemorySessionSummarySchema>;
