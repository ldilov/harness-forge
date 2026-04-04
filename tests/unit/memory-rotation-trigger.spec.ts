import { describe, expect, it } from 'vitest';

import { shouldRotateMemory } from '../../src/application/compaction/memory/memory-rotation-trigger.js';
import { SIZE_BUDGET } from '../../src/domain/compaction/memory/memory-content-rules.js';

describe('shouldRotateMemory', () => {
  it('returns true when content exceeds the hard cap token budget', () => {
    // hardCapTokens = 4000, charsPerToken = 4 → 16001 chars → 4001 tokens > 4000
    const oversizedContent = 'x'.repeat(SIZE_BUDGET.hardCapTokens * SIZE_BUDGET.charsPerToken + 1);
    expect(shouldRotateMemory(oversizedContent)).toBe(true);
  });

  it('returns false when content is within the token budget', () => {
    // 100 chars → 25 tokens, well within 4000
    const smallContent = 'a'.repeat(100);
    expect(shouldRotateMemory(smallContent)).toBe(false);
  });

  it('returns false when content is exactly at the hard cap boundary', () => {
    // Exactly hardCapTokens * charsPerToken chars → exactly 4000 tokens, not > 4000
    const boundaryContent = 'b'.repeat(SIZE_BUDGET.hardCapTokens * SIZE_BUDGET.charsPerToken);
    expect(shouldRotateMemory(boundaryContent)).toBe(false);
  });

  it('returns true for content just one character over the boundary', () => {
    // 16001 chars → ceil(16001 / 4) = 4001 tokens > 4000
    const justOverContent = 'c'.repeat(SIZE_BUDGET.hardCapTokens * SIZE_BUDGET.charsPerToken + 1);
    expect(shouldRotateMemory(justOverContent)).toBe(true);
  });

  it('returns false for empty content', () => {
    expect(shouldRotateMemory('')).toBe(false);
  });
});
