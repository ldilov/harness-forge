import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { generateTaskSummary } from '../../src/infrastructure/events/task-summary-generator.js';
import type { EventEnvelope } from '../../src/domain/observability/events/event-envelope.js';

function makeEnvelope(overrides: Partial<EventEnvelope> = {}): EventEnvelope {
  return {
    eventId: 'evt_1',
    eventType: 'task.started',
    occurredAt: '2025-06-01T10:00:00Z',
    schemaVersion: '1.0.0',
    runtimeSessionId: 'rsn_1',
    payload: {},
    ...overrides,
  };
}

describe('generateTaskSummary', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'task-summary-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('generates summary file for given taskId', async () => {
    const dir = makeTempDir();
    const events: EventEnvelope[] = [
      makeEnvelope({ eventId: 'evt_a', taskId: 'task_abc', eventType: 'task.started', occurredAt: '2025-06-01T10:00:00Z' }),
      makeEnvelope({ eventId: 'evt_b', taskId: 'task_abc', eventType: 'task.completed', occurredAt: '2025-06-01T10:05:00Z' }),
    ];

    await generateTaskSummary(events, 'task_abc', dir);

    const summaryPath = join(dir, 'summaries', 'task_abc.json');
    const content = await readFile(summaryPath, 'utf-8');
    const summary = JSON.parse(content);

    expect(summary.taskId).toBe('task_abc');
    expect(summary.firstEvent).toBe('2025-06-01T10:00:00Z');
    expect(summary.lastEvent).toBe('2025-06-01T10:05:00Z');
  });

  it('summary contains correct event count and types', async () => {
    const dir = makeTempDir();
    const events: EventEnvelope[] = [
      makeEnvelope({ eventId: 'evt_1', taskId: 'task_x', eventType: 'task.started', occurredAt: '2025-01-01T00:00:00Z' }),
      makeEnvelope({ eventId: 'evt_2', taskId: 'task_x', eventType: 'file.created', occurredAt: '2025-01-01T00:01:00Z' }),
      makeEnvelope({ eventId: 'evt_3', taskId: 'task_x', eventType: 'task.completed', occurredAt: '2025-01-01T00:02:00Z' }),
      makeEnvelope({ eventId: 'evt_4', taskId: 'task_other', eventType: 'task.started', occurredAt: '2025-01-01T00:03:00Z' }),
    ];

    await generateTaskSummary(events, 'task_x', dir);

    const summaryPath = join(dir, 'summaries', 'task_x.json');
    const content = await readFile(summaryPath, 'utf-8');
    const summary = JSON.parse(content);

    expect(summary.eventCount).toBe(3);
    expect(summary.eventTypes).toEqual(['task.started', 'file.created', 'task.completed']);
  });
});
