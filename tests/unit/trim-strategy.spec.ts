import { describe, it, expect } from 'vitest';

import { applyTrim } from '../../src/application/compaction/strategies/trim-strategy.js';
import type { TurnImportanceItem } from '../../src/domain/compaction/turn-importance.js';

function makeItem(overrides: Partial<TurnImportanceItem> & { id: string }): TurnImportanceItem {
  return {
    type: 'event',
    importance: 'medium',
    canonicality: 'canonical',
    redundancyScore: 0.0,
    recoverability: 'recoverable',
    ...overrides,
  };
}

describe('applyTrim', () => {
  it('removes low-importance items with high redundancy', () => {
    const items: TurnImportanceItem[] = [
      makeItem({ id: '1', importance: 'low', redundancyScore: 0.8 }),
      makeItem({ id: '2', importance: 'high', redundancyScore: 0.0 }),
    ];
    const result = applyTrim(items);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('2');
  });

  it('keeps low-importance items with low redundancy', () => {
    const items: TurnImportanceItem[] = [
      makeItem({ id: '1', importance: 'low', redundancyScore: 0.2 }),
    ];
    const result = applyTrim(items);
    expect(result).toHaveLength(1);
  });

  it('always keeps high-importance items regardless of redundancy', () => {
    const items: TurnImportanceItem[] = [
      makeItem({ id: '1', importance: 'high', redundancyScore: 0.9 }),
      makeItem({ id: '2', importance: 'critical', redundancyScore: 1.0 }),
    ];
    const result = applyTrim(items);
    expect(result).toHaveLength(2);
  });
});
