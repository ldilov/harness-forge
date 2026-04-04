import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { EventEnvelope } from '../../../domain/observability/events/event-envelope.js';
import { EventReader } from '../../../infrastructure/events/event-reader.js';

export async function loadArchiveEvents(
  workspaceRoot: string,
): Promise<readonly EventEnvelope[]> {
  const archiveDir = join(workspaceRoot, '.hforge/runtime/events/archive');
  let entries: string[];

  try {
    entries = await readdir(archiveDir);
  } catch {
    return [];
  }

  const ndjsonFiles = entries
    .filter((entry) => entry.endsWith('.ndjson'))
    .sort();

  const reader = new EventReader(join(workspaceRoot, '.hforge/runtime/events'));
  const results: EventEnvelope[] = [];

  for (const file of ndjsonFiles) {
    const events = await reader.readAll(join(archiveDir, file));
    results.push(...events);
  }

  return results;
}
