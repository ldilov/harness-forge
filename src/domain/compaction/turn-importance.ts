import { z } from 'zod';
import { ImportanceSchema } from '../observability/events/event-importance.js';

export const TurnImportanceItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['conversation-turn', 'event', 'tool-output']),
  importance: ImportanceSchema,
  canonicality: z.enum(['canonical', 'non-canonical']),
  redundancyScore: z.number().min(0).max(1),
  recoverability: z.enum(['must-preserve', 'artifact-backed', 'recoverable', 'disposable']),
  recency: z.number().min(0).max(1).optional(),
  targetRelevance: z.number().min(0).max(1).optional(),
});

export type TurnImportanceItem = z.infer<typeof TurnImportanceItemSchema>;

export const TurnImportanceSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  items: z.array(TurnImportanceItemSchema),
});

export type TurnImportance = z.infer<typeof TurnImportanceSchema>;
