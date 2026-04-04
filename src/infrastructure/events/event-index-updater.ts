import { join } from 'node:path';

import { writeJsonFile } from '../../shared/fs.js';
import type { EventEnvelope } from '../../domain/observability/events/event-envelope.js';

interface EventIndex {
  readonly totalEvents: number;
  readonly categoryCounts: Record<string, number>;
  readonly taskIds: readonly string[];
  readonly dateRange: {
    readonly earliest: string;
    readonly latest: string;
  } | null;
}

export async function updateEventIndex(
  events: readonly EventEnvelope[],
  basePath: string = '.hforge/runtime/events',
): Promise<void> {
  if (events.length === 0) {
    const index: EventIndex = {
      totalEvents: 0,
      categoryCounts: {},
      taskIds: [],
      dateRange: null,
    };
    await writeJsonFile(join(basePath, 'index.json'), index);
    return;
  }

  const categoryCounts: Record<string, number> = {};
  const taskIdSet = new Set<string>();
  let earliest = events[0]!.occurredAt;
  let latest = events[0]!.occurredAt;

  for (const evt of events) {
    const cat = evt.category ?? 'uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;

    if (evt.taskId) {
      taskIdSet.add(evt.taskId);
    }

    if (evt.occurredAt < earliest) {
      earliest = evt.occurredAt;
    }
    if (evt.occurredAt > latest) {
      latest = evt.occurredAt;
    }
  }

  const index: EventIndex = {
    totalEvents: events.length,
    categoryCounts,
    taskIds: [...taskIdSet],
    dateRange: { earliest, latest },
  };

  await writeJsonFile(join(basePath, 'index.json'), index);
}
