import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { updateEventIndex } from '../../src/infrastructure/events/event-index-updater.js';
import type { EventEnvelope } from '../../src/domain/observability/events/event-envelope.js';

function makeEnvelope(overrides: Partial<EventEnvelope> = {}): EventEnvelope {
  return {
    eventId: 'evt_1',
    eventType: 'task.started',
    occurredAt: '2025-01-01T00:00:00Z',
    schemaVersion: '1.0.0',
    runtimeSessionId: 'rsn_1',
    payload: {},
    ...overrides,
  };
}

describe('updateEventIndex', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'event-index-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('index.json contains totalEvents, categoryCounts, taskIds, dateRange', async () => {
    const dir = makeTempDir();
    const events: EventEnvelope[] = [
      makeEnvelope({ eventId: 'evt_1', category: 'lifecycle', taskId: 'task_a', occurredAt: '2025-01-01T00:00:00Z' }),
      makeEnvelope({ eventId: 'evt_2', category: 'lifecycle', taskId: 'task_a', occurredAt: '2025-01-02T00:00:00Z' }),
      makeEnvelope({ eventId: 'evt_3', category: 'metric', taskId: 'task_b', occurredAt: '2025-01-03T00:00:00Z' }),
      makeEnvelope({ eventId: 'evt_4', occurredAt: '2025-01-04T00:00:00Z' }), // no category -> 'uncategorized'
    ];

    await updateEventIndex(events, dir);

    const indexPath = join(dir, 'index.json');
    const content = JSON.parse(await readFile(indexPath, 'utf-8'));

    expect(content.totalEvents).toBe(4);
    expect(content.categoryCounts).toEqual({
      lifecycle: 2,
      metric: 1,
      uncategorized: 1,
    });
    expect(content.taskIds).toEqual(expect.arrayContaining(['task_a', 'task_b']));
    expect(content.taskIds).toHaveLength(2);
    expect(content.dateRange).toEqual({
      earliest: '2025-01-01T00:00:00Z',
      latest: '2025-01-04T00:00:00Z',
    });
  });
});
