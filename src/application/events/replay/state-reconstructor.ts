import type { EventEnvelope } from '../../../domain/observability/events/event-envelope.js';

export interface ReconstructedState {
  readonly eventCount: number;
  readonly categories: ReadonlyArray<string>;
  readonly taskIds: ReadonlyArray<string>;
  readonly timeRange: { readonly first: string; readonly last: string } | null;
  readonly importanceCounts: Readonly<Record<string, number>>;
}

export function reconstructState(
  events: readonly EventEnvelope[],
): ReconstructedState {
  if (events.length === 0) {
    return {
      eventCount: 0,
      categories: [],
      taskIds: [],
      timeRange: null,
      importanceCounts: {},
    };
  }

  const categories = new Set<string>();
  const taskIds = new Set<string>();
  const importanceCounts: Record<string, number> = {};

  for (const event of events) {
    if (event.category !== undefined) {
      categories.add(event.category);
    }
    if (event.taskId !== undefined) {
      taskIds.add(event.taskId);
    }
    const imp = event.importance ?? 'unspecified';
    importanceCounts[imp] = (importanceCounts[imp] ?? 0) + 1;
  }

  const sorted = [...events].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  return {
    eventCount: events.length,
    categories: [...categories].sort(),
    taskIds: [...taskIds].sort(),
    timeRange: {
      first: sorted[0]!.occurredAt,
      last: sorted[sorted.length - 1]!.occurredAt,
    },
    importanceCounts,
  };
}
