import { randomBytes } from 'node:crypto';

const PREFIXES = {
  event: 'evt_',
  session: 'rsn_',
  task: 'task_',
  run: 'run_',
  correlation: 'corr_',
  summary: 'sum_',
  delta: 'delta_',
  compaction: 'cmp_',
  decision: 'dec_',
  manifest: 'mfst_',
} as const;

export type IdPrefix = keyof typeof PREFIXES;

export function generateId(prefix: IdPrefix): string {
  const hex = randomBytes(12).toString('hex');
  return `${PREFIXES[prefix]}${hex}`;
}
