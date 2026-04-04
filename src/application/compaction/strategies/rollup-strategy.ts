import type { TurnImportanceItem } from '../../../domain/compaction/turn-importance.js';

export function applyRollup(items: readonly TurnImportanceItem[]): TurnImportanceItem[] {
  return items.filter(
    (item) => item.importance === 'critical' || item.importance === 'high',
  );
}
