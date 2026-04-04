import { join } from 'node:path';

import { writeJsonFile } from '../../shared/fs.js';
import { aggregateCostByTaskId } from '../../application/compaction/cost-aggregator.js';
import type { EventEnvelope } from '../../domain/observability/events/event-envelope.js';

interface TaskSummary {
  readonly taskId: string;
  readonly eventCount: number;
  readonly firstEvent: string;
  readonly lastEvent: string;
  readonly eventTypes: readonly string[];
  readonly totalCost: {
    readonly durationMs: number;
    readonly tokensUsed: number;
    readonly apiCalls: number;
  };
}

export async function generateTaskSummary(
  events: readonly EventEnvelope[],
  taskId: string,
  basePath: string = '.hforge/runtime/events',
): Promise<void> {
  const filtered = events.filter((evt) => evt.taskId === taskId);
  if (filtered.length === 0) return;

  const sorted = [...filtered].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  );

  const eventTypes = [...new Set(sorted.map((evt) => evt.eventType))];

  const costMap = aggregateCostByTaskId(sorted);
  const cost = costMap.get(taskId);

  const summary: TaskSummary = {
    taskId,
    eventCount: sorted.length,
    firstEvent: sorted[0]!.occurredAt,
    lastEvent: sorted[sorted.length - 1]!.occurredAt,
    eventTypes,
    totalCost: {
      durationMs: cost?.durationMs ?? 0,
      tokensUsed: cost?.tokensUsed ?? 0,
      apiCalls: cost?.apiCalls ?? 0,
    },
  };

  const destination = join(basePath, 'summaries', `${taskId}.json`);
  await writeJsonFile(destination, summary);
}
