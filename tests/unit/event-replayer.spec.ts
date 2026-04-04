import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { replayEvents, replaySubtree } from '../../src/application/events/replay/event-replayer.js';
import type { EventEnvelope } from '../../src/domain/observability/events/event-envelope.js';

function makeEvent(overrides: Partial<EventEnvelope> & { eventId: string }): EventEnvelope {
  return {
    eventType: 'test.event',
    occurredAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    runtimeSessionId: 'session-1',
    payload: {},
    ...overrides,
  };
}

describe('replayEvents', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-replay-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  async function writeEvents(events: EventEnvelope[]): Promise<void> {
    const eventsDir = path.join(tmpDir, '.hforge/runtime/events');
    await fs.mkdir(eventsDir, { recursive: true });
    const ndjson = events.map((e) => JSON.stringify(e)).join('\n') + '\n';
    await fs.writeFile(path.join(eventsDir, 'current.ndjson'), ndjson, 'utf-8');
  }

  it('filters events by taskId', async () => {
    const events = [
      makeEvent({ eventId: 'e1', taskId: 'task-A' }),
      makeEvent({ eventId: 'e2', taskId: 'task-B' }),
      makeEvent({ eventId: 'e3', taskId: 'task-A' }),
    ];

    await writeEvents(events);

    const result = await replayEvents(tmpDir, { taskId: 'task-A' });

    expect(result.matchedCount).toBe(2);
    expect(result.events.every((e) => e.taskId === 'task-A')).toBe(true);
    expect(result.totalRead).toBe(3);
  });

  it('returns all events when no filter is specified', async () => {
    const events = [
      makeEvent({ eventId: 'e1' }),
      makeEvent({ eventId: 'e2' }),
    ];

    await writeEvents(events);

    const result = await replayEvents(tmpDir, {});

    expect(result.matchedCount).toBe(2);
    expect(result.totalRead).toBe(2);
  });

  it('returns empty results when no events file exists', async () => {
    const result = await replayEvents(tmpDir, { taskId: 'nonexistent' });

    expect(result.matchedCount).toBe(0);
    expect(result.totalRead).toBe(0);
    expect(result.events).toEqual([]);
  });
});

describe('replaySubtree', () => {
  it('collects all child events recursively', () => {
    const events: EventEnvelope[] = [
      makeEvent({ eventId: 'root' }),
      makeEvent({ eventId: 'child-1', parentEventId: 'root' }),
      makeEvent({ eventId: 'child-2', parentEventId: 'root' }),
      makeEvent({ eventId: 'grandchild-1', parentEventId: 'child-1' }),
      makeEvent({ eventId: 'unrelated' }),
    ];

    const subtree = replaySubtree(events, 'root');

    const ids = subtree.map((e) => e.eventId);
    expect(ids).toContain('root');
    expect(ids).toContain('child-1');
    expect(ids).toContain('child-2');
    expect(ids).toContain('grandchild-1');
    expect(ids).not.toContain('unrelated');
    expect(subtree.length).toBe(4);
  });

  it('returns only the root event when it has no children', () => {
    const events: EventEnvelope[] = [
      makeEvent({ eventId: 'root' }),
      makeEvent({ eventId: 'other' }),
    ];

    const subtree = replaySubtree(events, 'root');

    expect(subtree.length).toBe(1);
    expect(subtree[0]!.eventId).toBe('root');
  });

  it('returns empty array when root event is not in the list', () => {
    const events: EventEnvelope[] = [
      makeEvent({ eventId: 'a' }),
      makeEvent({ eventId: 'b' }),
    ];

    const subtree = replaySubtree(events, 'nonexistent');

    expect(subtree).toEqual([]);
  });
});
