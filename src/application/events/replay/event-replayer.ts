import type { EventEnvelope } from '../../../domain/observability/events/event-envelope.js';
import { EventReader } from '../../../infrastructure/events/event-reader.js';

export interface ReplayFilter {
  readonly taskId?: string;
  readonly correlationId?: string;
  readonly category?: string;
  readonly importance?: string;
  readonly parentEventId?: string;
}

export interface ReplayResult {
  readonly events: readonly EventEnvelope[];
  readonly totalRead: number;
  readonly matchedCount: number;
}

export async function replayEvents(
  workspaceRoot: string,
  filters: ReplayFilter,
): Promise<ReplayResult> {
  const reader = new EventReader(`${workspaceRoot}/.hforge/runtime/events`);
  const allEvents = await reader.readAll();
  let matched = reader.filterEvents(allEvents, {
    taskId: filters.taskId,
    correlationId: filters.correlationId,
    category: filters.category,
    importance: filters.importance,
  });

  if (filters.parentEventId) {
    matched = replaySubtree(allEvents, filters.parentEventId);
  }

  return {
    events: matched,
    totalRead: allEvents.length,
    matchedCount: matched.length,
  };
}

export function replaySubtree(
  allEvents: readonly EventEnvelope[],
  rootEventId: string,
): EventEnvelope[] {
  const collected = new Set<string>([rootEventId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const evt of allEvents) {
      if (!collected.has(evt.eventId) && evt.parentEventId && collected.has(evt.parentEventId)) {
        collected.add(evt.eventId);
        changed = true;
      }
    }
  }
  return allEvents.filter(evt => collected.has(evt.eventId));
}
