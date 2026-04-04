import { z } from 'zod';

import { MemorySessionSummarySchema } from './memory-session-summary.js';

export const MemoryArchiveSchema = MemorySessionSummarySchema.extend({
  archivedAt: z.string(),
  previousSummary: z.string().optional(),
});

export type MemoryArchive = z.infer<typeof MemoryArchiveSchema>;
