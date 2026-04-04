import { describe, it, expect } from 'vitest';

import { estimateMemoryTokens, isWithinBudget } from '../../src/application/compaction/memory/memory-size-estimator.js';

describe('estimateMemoryTokens', () => {
  it('estimates tokens based on character length divided by charsPerToken (4)', () => {
    const content = 'a'.repeat(400);
    expect(estimateMemoryTokens(content)).toBe(100);
  });

  it('rounds up for partial tokens', () => {
    expect(estimateMemoryTokens('hello')).toBe(2);
  });
});

describe('isWithinBudget', () => {
  it('returns true for content under the hard cap (4000 tokens)', () => {
    const content = 'a'.repeat(4000 * 4 - 1);
    expect(isWithinBudget(content)).toBe(true);
  });

  it('returns false for content exceeding the hard cap', () => {
    const content = 'a'.repeat(4000 * 4 + 4);
    expect(isWithinBudget(content)).toBe(false);
  });
});
