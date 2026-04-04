import { z } from 'zod';

export const CompactionLevel = z.enum(['none', 'trim', 'summarize', 'rollup', 'rollover']);
export type CompactionLevel = z.infer<typeof CompactionLevel>;

export const LEVEL_NUMBER: Record<CompactionLevel, number> = {
  none: 0,
  trim: 1,
  summarize: 2,
  rollup: 3,
  rollover: 4,
};
