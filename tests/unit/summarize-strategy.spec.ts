import { describe, expect, it } from 'vitest';

import { applySummarize } from '../../src/application/compaction/strategies/summarize-strategy.js';
import type { TurnImportanceItem } from '../../src/domain/compaction/turn-importance.js';

function makeItem(overrides: Partial<TurnImportanceItem> = {}): TurnImportanceItem {
  return {
    id: `item-${Math.random().toString(36).slice(2, 8)}`,
    type: 'event',
    importance: 'medium',
    canonicality: 'canonical',
    redundancyScore: 0.0,
    recoverability: 'recoverable',
    ...overrides,
  };
}

describe('applySummarize', () => {
  it('drops all low-importance items', () => {
    const items: readonly TurnImportanceItem[] = [
      makeItem({ id: 'low-1', importance: 'low', redundancyScore: 0.0 }),
      makeItem({ id: 'low-2', importance: 'low', redundancyScore: 0.9 }),
      makeItem({ id: 'high-1', importance: 'high' }),
    ];

    const result = applySummarize(items);

    expect(result.find((i) => i.id === 'low-1')).toBeUndefined();
    expect(result.find((i) => i.id === 'low-2')).toBeUndefined();
    expect(result).toHaveLength(1);
  });

  it('drops medium items with redundancyScore > 0.3', () => {
    const items: readonly TurnImportanceItem[] = [
      makeItem({ id: 'med-redundant', importance: 'medium', redundancyScore: 0.5 }),
      makeItem({ id: 'med-keep', importance: 'medium', redundancyScore: 0.1 }),
    ];

    const result = applySummarize(items);

    expect(result.find((i) => i.id === 'med-redundant')).toBeUndefined();
    expect(result.find((i) => i.id === 'med-keep')).toBeDefined();
  });

  it('preserves high and critical items', () => {
    const items: readonly TurnImportanceItem[] = [
      makeItem({ id: 'critical-1', importance: 'critical' }),
      makeItem({ id: 'high-1', importance: 'high' }),
      makeItem({ id: 'low-1', importance: 'low' }),
    ];

    const result = applySummarize(items);

    expect(result.find((i) => i.id === 'critical-1')).toBeDefined();
    expect(result.find((i) => i.id === 'high-1')).toBeDefined();
    expect(result).toHaveLength(2);
  });

  it('preserves medium items with low redundancy', () => {
    const items: readonly TurnImportanceItem[] = [
      makeItem({ id: 'med-low-r', importance: 'medium', redundancyScore: 0.1 }),
      makeItem({ id: 'med-zero-r', importance: 'medium', redundancyScore: 0.0 }),
      makeItem({ id: 'med-boundary', importance: 'medium', redundancyScore: 0.3 }),
    ];

    const result = applySummarize(items);

    expect(result.find((i) => i.id === 'med-low-r')).toBeDefined();
    expect(result.find((i) => i.id === 'med-zero-r')).toBeDefined();
    expect(result.find((i) => i.id === 'med-boundary')).toBeDefined();
    expect(result).toHaveLength(3);
  });
});
