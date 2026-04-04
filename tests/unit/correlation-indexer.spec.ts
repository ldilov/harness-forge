import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { indexByCorrelation } from '../../src/infrastructure/events/correlation-indexer.js';
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

describe('indexByCorrelation', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'corr-indexer-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('creates correlation files grouped by correlationId', async () => {
    const dir = makeTempDir();
    const events: EventEnvelope[] = [
      makeEnvelope({ eventId: 'evt_1', correlationId: 'corr_a' }),
      makeEnvelope({ eventId: 'evt_2', correlationId: 'corr_a' }),
      makeEnvelope({ eventId: 'evt_3', correlationId: 'corr_b' }),
      makeEnvelope({ eventId: 'evt_4' }), // no correlationId, should be skipped
    ];

    await indexByCorrelation(events, dir);

    const corrAPath = join(dir, 'correlations', 'corr_a.json');
    const corrAContent = JSON.parse(await readFile(corrAPath, 'utf-8'));
    expect(corrAContent).toHaveLength(2);
    expect(corrAContent.map((e: EventEnvelope) => e.eventId)).toEqual(['evt_1', 'evt_2']);

    const corrBPath = join(dir, 'correlations', 'corr_b.json');
    const corrBContent = JSON.parse(await readFile(corrBPath, 'utf-8'));
    expect(corrBContent).toHaveLength(1);
    expect(corrBContent[0].eventId).toBe('evt_3');
  });
});
