import { describe, it, expect } from 'vitest';

import { evaluateThreshold } from '../../src/application/compaction/triggers/threshold-trigger.js';

describe('evaluateThreshold', () => {
  const thresholds = {
    evaluateAt: 0.70,
    trimAt: 0.80,
    summarizeAt: 0.88,
    rollupAt: 0.93,
    rolloverAt: 0.96,
  };

  it('returns none when below all thresholds', () => {
    expect(evaluateThreshold(0.50, thresholds)).toBe('none');
  });

  it('returns trim at the evaluate threshold', () => {
    expect(evaluateThreshold(0.72, thresholds)).toBe('trim');
  });

  it('returns trim at the trim threshold', () => {
    expect(evaluateThreshold(0.85, thresholds)).toBe('trim');
  });

  it('returns summarize at the summarize threshold', () => {
    expect(evaluateThreshold(0.90, thresholds)).toBe('summarize');
  });

  it('returns rollover at the rollover threshold', () => {
    expect(evaluateThreshold(0.97, thresholds)).toBe('rollover');
  });
});
