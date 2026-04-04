import type { TurnImportanceItem } from '../../../domain/compaction/turn-importance.js';

export function applySummarize(items: readonly TurnImportanceItem[]): TurnImportanceItem[] {
  return items.filter((item) => {
    if (item.importance === 'low') return false;
    if (item.importance === 'medium' && item.redundancyScore > 0.3) return false;
    return true;
  });
}
