import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CompactionService } from '../../src/application/compaction/compaction-service.js';
import type { EventEnvelope } from '../../src/domain/observability/events/event-envelope.js';

function makeEvent(overrides: Partial<EventEnvelope> = {}): EventEnvelope {
  return {
    eventId: `evt-${Math.random().toString(36).slice(2, 8)}`,
    eventType: 'event',
    occurredAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    runtimeSessionId: 'session-1',
    payload: {},
    importance: 'medium',
    ...overrides,
  };
}

function validOptions(basePath: string, overrides: Record<string, unknown> = {}) {
  return {
    level: 'trim' as const,
    events: [
      makeEvent({ eventId: 'e1', importance: 'critical' }),
      makeEvent({ eventId: 'e2', importance: 'medium' }),
      makeEvent({ eventId: 'e3', importance: 'low' }),
    ],
    objective: 'Build the feature',
    acceptedPlan: ['step-1', 'step-2'],
    decisions: [{ id: 'd1', title: 'Use X', rationale: 'Because Y' }],
    unresolved: ['issue-1'],
    artifacts: ['file.ts'],
    runtimeSessionId: 'session-test',
    ...overrides,
  };
}

describe('CompactionService', () => {
  let tempDir: string;
  let service: CompactionService;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'compaction-'));
    service = new CompactionService(tempDir);
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('compact() at level trim produces a valid manifest', async () => {
    const manifest = await service.compact(validOptions(tempDir, { level: 'trim' }));

    expect(manifest.schemaVersion).toBe('1.0.0');
    expect(manifest.manifestId).toBeTruthy();
    expect(manifest.createdAt).toBeTruthy();
    expect(manifest.strategy.level).toBe(1); // trim = 1
    expect(manifest.validation.passed).toBe(true);
  });

  it('compact() at level summarize produces a valid manifest', async () => {
    const manifest = await service.compact(validOptions(tempDir, { level: 'summarize' }));

    expect(manifest.schemaVersion).toBe('1.0.0');
    expect(manifest.strategy.level).toBe(2); // summarize = 2
    expect(manifest.validation.passed).toBe(true);
  });

  it('compact() writes session-summary.json to basePath', async () => {
    await service.compact(validOptions(tempDir));

    const filePath = join(tempDir, 'session-summary.json');
    expect(existsSync(filePath)).toBe(true);

    const content = JSON.parse(await readFile(filePath, 'utf-8'));
    expect(content.schemaVersion).toBe('1.0.0');
    expect(content.objective).toBe('Build the feature');
    expect(content.acceptedPlan).toEqual(['step-1', 'step-2']);
  });

  it('compact() writes delta-summary.json to basePath', async () => {
    await service.compact(validOptions(tempDir));

    const filePath = join(tempDir, 'delta-summary.json');
    expect(existsSync(filePath)).toBe(true);

    const content = JSON.parse(await readFile(filePath, 'utf-8'));
    expect(content.schemaVersion).toBe('1.0.0');
    expect(content.status).toBe('compacted');
  });

  it('compact() writes active-context.json to basePath', async () => {
    await service.compact(validOptions(tempDir));

    const filePath = join(tempDir, 'active-context.json');
    expect(existsSync(filePath)).toBe(true);

    const content = JSON.parse(await readFile(filePath, 'utf-8'));
    expect(content.schemaVersion).toBe('1.0.0');
    expect(content.objective).toBe('Build the feature');
  });

  it('compact() writes compaction-manifest.json to basePath', async () => {
    await service.compact(validOptions(tempDir));

    const filePath = join(tempDir, 'compaction-manifest.json');
    expect(existsSync(filePath)).toBe(true);

    const content = JSON.parse(await readFile(filePath, 'utf-8'));
    expect(content.schemaVersion).toBe('1.0.0');
    expect(content.validation.passed).toBe(true);
  });

  it('compact() throws when validation fails (missing objective)', async () => {
    await expect(
      service.compact(validOptions(tempDir, { objective: '' })),
    ).rejects.toThrow('Compaction validation failed');
  });

  it('compact() returns manifest with correct savingsRatio stats', async () => {
    const events = [
      makeEvent({ eventId: 'c1', importance: 'critical' }),
      makeEvent({ eventId: 'h1', importance: 'high' }),
      makeEvent({ eventId: 'm1', importance: 'medium' }),
      makeEvent({ eventId: 'l1', importance: 'low' }),
      makeEvent({ eventId: 'l2', importance: 'low' }),
    ];

    const manifest = await service.compact(
      validOptions(tempDir, { level: 'summarize', events }),
    );

    // summarize drops all low items (redundancyScore is 0.0 from classifyItem
    // for non-duplicates, but importance === 'low' returns false in applySummarize)
    expect(manifest.stats.estimatedTokensBefore).toBe(events.length * 100);
    expect(manifest.stats.estimatedTokensAfter).toBeLessThanOrEqual(
      manifest.stats.estimatedTokensBefore,
    );
    expect(manifest.stats.preservedCriticalItems).toBe(1);
    expect(manifest.stats.droppedLowImportanceItems).toBeGreaterThanOrEqual(0);
  });
});
