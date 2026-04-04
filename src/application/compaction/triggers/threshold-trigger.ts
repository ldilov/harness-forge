import type { CompactionLevel } from '../../../domain/compaction/compaction-level.js';

interface Thresholds {
  readonly evaluateAt: number;
  readonly trimAt: number;
  readonly summarizeAt: number;
  readonly rollupAt: number;
  readonly rolloverAt: number;
}

export function evaluateThreshold(
  currentPercentage: number,
  thresholds: Thresholds,
): CompactionLevel {
  if (currentPercentage >= thresholds.rolloverAt) return 'rollover';
  if (currentPercentage >= thresholds.rollupAt) return 'rollup';
  if (currentPercentage >= thresholds.summarizeAt) return 'summarize';
  if (currentPercentage >= thresholds.trimAt) return 'trim';
  if (currentPercentage >= thresholds.evaluateAt) return 'trim';
  return 'none';
}
