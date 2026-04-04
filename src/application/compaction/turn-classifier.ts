import type { Importance } from '../../domain/observability/events/event-importance.js';
import type { TurnImportanceItem } from '../../domain/compaction/turn-importance.js';

interface ClassifiableItem {
  id: string;
  type: string;
  importance?: string;
  isCanonical?: boolean;
  duplicateOf?: string;
  occurredAt?: string;
  targetName?: string;
}

const RECOVERABILITY_BY_IMPORTANCE: Record<string, TurnImportanceItem['recoverability']> = {
  critical: 'must-preserve',
  high: 'artifact-backed',
  medium: 'recoverable',
  low: 'disposable',
  trace: 'disposable',
};

const VALID_TYPES = new Set<TurnImportanceItem['type']>([
  'conversation-turn',
  'event',
  'tool-output',
]);

export function classifyItem(item: ClassifiableItem): TurnImportanceItem {
  const importance: Importance =
    item.importance === 'critical' ||
    item.importance === 'high' ||
    item.importance === 'medium' ||
    item.importance === 'low' ||
    item.importance === 'trace'
      ? item.importance
      : 'medium';

  const type: TurnImportanceItem['type'] = VALID_TYPES.has(item.type as TurnImportanceItem['type'])
    ? (item.type as TurnImportanceItem['type'])
    : 'event';

  const redundancyScore = item.duplicateOf ? 0.8 : 0.0;
  const recoverability = RECOVERABILITY_BY_IMPORTANCE[importance] ?? 'recoverable';
  const canonicality: TurnImportanceItem['canonicality'] = item.isCanonical === false
    ? 'non-canonical'
    : 'canonical';

  const recency = item.occurredAt
    ? Math.max(0, Math.min(1, 1 - (Date.now() - new Date(item.occurredAt).getTime()) / (24 * 60 * 60 * 1000)))
    : undefined;

  const targetRelevance = item.targetName ? 1.0 : undefined;

  return {
    id: item.id,
    type,
    importance,
    canonicality,
    redundancyScore,
    recoverability,
    recency,
    targetRelevance,
  };
}
