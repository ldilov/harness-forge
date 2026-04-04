import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { EventReader } from '../../src/infrastructure/events/event-reader.js';
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

describe('EventReader', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'event-reader-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  describe('readAll', () => {
    it('reads all events from NDJSON', async () => {
      const dir = makeTempDir();
      const events = [
        makeEnvelope({ eventId: 'evt_a' }),
        makeEnvelope({ eventId: 'evt_b' }),
        makeEnvelope({ eventId: 'evt_c' }),
      ];
      const ndjson = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
      const filePath = join(dir, 'current.ndjson');
      await writeFile(filePath, ndjson, 'utf-8');

      const reader = new EventReader(dir);
      const result = await reader.readAll();

      expect(result).toHaveLength(3);
      expect(result.map((e) => e.eventId)).toEqual(['evt_a', 'evt_b', 'evt_c']);
    });

    it('returns empty array for missing file', async () => {
      const dir = makeTempDir();
      const reader = new EventReader(dir);

      const result = await reader.readAll();

      expect(result).toEqual([]);
    });

    it('skips empty lines', async () => {
      const dir = makeTempDir();
      const event = makeEnvelope({ eventId: 'evt_only' });
      const content = '\n' + JSON.stringify(event) + '\n\n\n';
      const filePath = join(dir, 'current.ndjson');
      await writeFile(filePath, content, 'utf-8');

      const reader = new EventReader(dir);
      const result = await reader.readAll();

      expect(result).toHaveLength(1);
      expect(result[0]!.eventId).toBe('evt_only');
    });
  });

  describe('filterEvents', () => {
    const events: readonly EventEnvelope[] = [
      makeEnvelope({ eventId: 'evt_1', eventType: 'task.started', taskId: 'task_a', importance: 'high', correlationId: 'corr_x' }),
      makeEnvelope({ eventId: 'evt_2', eventType: 'task.completed', taskId: 'task_a', importance: 'medium', correlationId: 'corr_x' }),
      makeEnvelope({ eventId: 'evt_3', eventType: 'file.created', taskId: 'task_b', importance: 'low', correlationId: 'corr_y' }),
      makeEnvelope({ eventId: 'evt_4', eventType: 'task.started', taskId: 'task_c', importance: 'high', correlationId: 'corr_y' }),
    ];

    it('filters by eventType', () => {
      const dir = makeTempDir();
      const reader = new EventReader(dir);

      const result = reader.filterEvents(events, { eventType: 'task.started' });

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.eventId)).toEqual(['evt_1', 'evt_4']);
    });

    it('filters by taskId', () => {
      const dir = makeTempDir();
      const reader = new EventReader(dir);

      const result = reader.filterEvents(events, { taskId: 'task_a' });

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.eventId)).toEqual(['evt_1', 'evt_2']);
    });

    it('filters by importance', () => {
      const dir = makeTempDir();
      const reader = new EventReader(dir);

      const result = reader.filterEvents(events, { importance: 'high' });

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.eventId)).toEqual(['evt_1', 'evt_4']);
    });

    it('filters by correlationId', () => {
      const dir = makeTempDir();
      const reader = new EventReader(dir);

      const result = reader.filterEvents(events, { correlationId: 'corr_y' });

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.eventId)).toEqual(['evt_3', 'evt_4']);
    });
  });
});
