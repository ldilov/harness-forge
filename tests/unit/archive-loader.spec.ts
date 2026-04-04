import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { loadArchiveEvents } from '../../src/application/events/replay/archive-loader.js';
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

describe('loadArchiveEvents', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-archive-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('loads events from archive NDJSON files', async () => {
    const archiveDir = path.join(tmpDir, '.hforge/runtime/events/archive');
    await fs.mkdir(archiveDir, { recursive: true });

    const events1 = [
      makeEvent({ eventId: 'a1', occurredAt: '2025-01-01T00:00:00Z' }),
      makeEvent({ eventId: 'a2', occurredAt: '2025-01-01T01:00:00Z' }),
    ];
    const events2 = [
      makeEvent({ eventId: 'b1', occurredAt: '2025-01-02T00:00:00Z' }),
    ];

    const ndjson1 = events1.map((e) => JSON.stringify(e)).join('\n') + '\n';
    const ndjson2 = events2.map((e) => JSON.stringify(e)).join('\n') + '\n';

    await fs.writeFile(path.join(archiveDir, '2025-01-01.ndjson'), ndjson1, 'utf-8');
    await fs.writeFile(path.join(archiveDir, '2025-01-02.ndjson'), ndjson2, 'utf-8');

    const loaded = await loadArchiveEvents(tmpDir);

    expect(loaded.length).toBe(3);
    const ids = loaded.map((e) => e.eventId);
    expect(ids).toContain('a1');
    expect(ids).toContain('a2');
    expect(ids).toContain('b1');
  });

  it('reads files in sorted order', async () => {
    const archiveDir = path.join(tmpDir, '.hforge/runtime/events/archive');
    await fs.mkdir(archiveDir, { recursive: true });

    const eventsB = [makeEvent({ eventId: 'b1', occurredAt: '2025-02-01T00:00:00Z' })];
    const eventsA = [makeEvent({ eventId: 'a1', occurredAt: '2025-01-01T00:00:00Z' })];

    await fs.writeFile(
      path.join(archiveDir, 'b-file.ndjson'),
      eventsB.map((e) => JSON.stringify(e)).join('\n') + '\n',
      'utf-8',
    );
    await fs.writeFile(
      path.join(archiveDir, 'a-file.ndjson'),
      eventsA.map((e) => JSON.stringify(e)).join('\n') + '\n',
      'utf-8',
    );

    const loaded = await loadArchiveEvents(tmpDir);

    // a-file comes before b-file when sorted alphabetically
    expect(loaded[0]!.eventId).toBe('a1');
    expect(loaded[1]!.eventId).toBe('b1');
  });

  it('returns empty array when archive directory is missing', async () => {
    const loaded = await loadArchiveEvents(tmpDir);

    expect(loaded).toEqual([]);
  });

  it('ignores non-ndjson files in the archive directory', async () => {
    const archiveDir = path.join(tmpDir, '.hforge/runtime/events/archive');
    await fs.mkdir(archiveDir, { recursive: true });

    await fs.writeFile(path.join(archiveDir, 'readme.txt'), 'not events', 'utf-8');
    await fs.writeFile(
      path.join(archiveDir, 'valid.ndjson'),
      JSON.stringify(makeEvent({ eventId: 'v1' })) + '\n',
      'utf-8',
    );

    const loaded = await loadArchiveEvents(tmpDir);

    expect(loaded.length).toBe(1);
    expect(loaded[0]!.eventId).toBe('v1');
  });
});
