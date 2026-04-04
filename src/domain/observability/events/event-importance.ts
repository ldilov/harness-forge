import { z } from 'zod';

export const ImportanceSchema = z.enum(['critical', 'high', 'medium', 'low', 'trace']);
export type Importance = z.infer<typeof ImportanceSchema>;

export const RetentionTierSchema = z.enum(['permanent', 'long', 'medium', 'short', 'ephemeral']);
export type RetentionTier = z.infer<typeof RetentionTierSchema>;
