import type { TurnImportanceItem } from '../../../domain/compaction/turn-importance.js';

export function applyTrim(items: readonly TurnImportanceItem[]): TurnImportanceItem[] {
  return items.filter(
    (item) => !(item.importance === 'low' && item.redundancyScore > 0.5),
  );
}
