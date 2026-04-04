import { describe, expect, it } from 'vitest';

import { applyRollup } from '../../src/application/compaction/strategies/rollup-strategy.js';
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

describe('applyRollup', () => {
  it('keeps only critical and high items', () => {
    const items: readonly TurnImportanceItem[] = [
      makeItem({ id: 'critical-1', importance: 'critical' }),
      makeItem({ id: 'high-1', importance: 'high' }),
      makeItem({ id: 'medium-1', importance: 'medium' }),
      makeItem({ id: 'low-1', importance: 'low' }),
    ];

    const result = applyRollup(items);

    expect(result).toHaveLength(2);
    expect(result.find((i) => i.id === 'critical-1')).toBeDefined();
    expect(result.find((i) => i.id === 'high-1')).toBeDefined();
  });

  it('drops all medium and low items', () => {
    const items: readonly TurnImportanceItem[] = [
      makeItem({ id: 'medium-1', importance: 'medium' }),
      makeItem({ id: 'medium-2', importance: 'medium' }),
      makeItem({ id: 'low-1', importance: 'low' }),
      makeItem({ id: 'low-2', importance: 'low' }),
    ];

    const result = applyRollup(items);

    expect(result).toHaveLength(0);
  });
});
