import { describe, it, expect } from 'vitest';

import { estimateTokens, recommendCompactionLevel } from '../../src/infrastructure/events/token-estimator.js';

describe('estimateTokens', () => {
  it('estimates tokens using default 4 chars per token', () => {
    expect(estimateTokens('abcdefgh')).toBe(2);
    expect(estimateTokens('a')).toBe(1);
  });

  it('accepts a custom charsPerToken value', () => {
    expect(estimateTokens('abcdefghij', 5)).toBe(2);
  });

  it('rounds up partial tokens', () => {
    expect(estimateTokens('abcde')).toBe(2);
  });
});

describe('recommendCompactionLevel', () => {
  const thresholds = {
    evaluateAt: 0.70,
    trimAt: 0.80,
    summarizeAt: 0.88,
    rollupAt: 0.93,
    rolloverAt: 0.96,
  };

  it('returns none below evaluate threshold', () => {
    expect(recommendCompactionLevel(0.50, thresholds)).toBe('none');
  });

  it('returns evaluate at the evaluate threshold', () => {
    expect(recommendCompactionLevel(0.72, thresholds)).toBe('evaluate');
  });

  it('returns trim at the trim threshold', () => {
    expect(recommendCompactionLevel(0.82, thresholds)).toBe('trim');
  });

  it('returns rollover at or above the rollover threshold', () => {
    expect(recommendCompactionLevel(0.97, thresholds)).toBe('rollover');
  });
});
