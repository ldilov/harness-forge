import { join } from 'node:path';

import { writeJsonFile } from '../../shared/fs.js';
import type { EventEnvelope } from '../../domain/observability/events/event-envelope.js';

export async function indexByCorrelation(
  events: readonly EventEnvelope[],
  basePath: string = '.hforge/runtime/events',
): Promise<void> {
  const groups = new Map<string, EventEnvelope[]>();

  for (const evt of events) {
    const key = evt.correlationId;
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.push(evt);
    } else {
      groups.set(key, [evt]);
    }
  }

  const writes: Promise<void>[] = [];
  for (const [correlationId, group] of groups) {
    const destination = join(basePath, 'correlations', `${correlationId}.json`);
    writes.push(writeJsonFile(destination, group));
  }

  await Promise.all(writes);
}
