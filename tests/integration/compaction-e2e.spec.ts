import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { CompactionService } from '../../src/application/compaction/compaction-service.js';
import { CompactionManifestSchema } from '../../src/domain/compaction/compaction-manifest.js';
import { rotateMemory } from '../../src/application/compaction/memory/memory-rotator.js';
import { writeSessionSummary } from '../../src/application/compaction/memory/session-summary-writer.js';
import { SIZE_BUDGET } from '../../src/domain/compaction/memory/memory-content-rules.js';
import type { EventEnvelope } from '../../src/domain/observability/events/event-envelope.js';
import type { MemorySessionSummary } from '../../src/domain/compaction/memory/memory-session-summary.js';

function makeEvent(overrides: Partial<EventEnvelope> & { eventId: string }): EventEnvelope {
  return {
    eventType: 'test.event',
    occurredAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    runtimeSessionId: 'session-e2e',
    importance: 'critical',
    payload: {},
    ...overrides,
  };
}

describe('compaction end-to-end pipeline', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-compaction-e2e-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('full pipeline: emit events -> compact -> verify manifest + memory + session-summary', async () => {
    // 1. Create sample events and write them to NDJSON
    const eventsDir = path.join(tmpDir, '.hforge/runtime/events');
    await fs.mkdir(eventsDir, { recursive: true });

    const sampleEvents: EventEnvelope[] = [
      makeEvent({
        eventId: 'evt-001',
        eventType: 'task.started',
        category: 'task',
        taskId: 'task-1',
        occurredAt: '2025-03-01T10:00:00Z',
      }),
      makeEvent({
        eventId: 'evt-002',
        eventType: 'artifact.emitted',
        category: 'artifact',
        taskId: 'task-1',
        occurredAt: '2025-03-01T10:05:00Z',
      }),
      makeEvent({
        eventId: 'evt-003',
        eventType: 'task.completed',
        category: 'task',
        taskId: 'task-1',
        occurredAt: '2025-03-01T10:10:00Z',
      }),
    ];

    const ndjson = sampleEvents.map((e) => JSON.stringify(e)).join('\n') + '\n';
    await fs.writeFile(path.join(eventsDir, 'current.ndjson'), ndjson, 'utf-8');

    // 2. Run CompactionService.compact()
    const contextBasePath = path.join(tmpDir, '.hforge/runtime/context');
    const service = new CompactionService(contextBasePath);

    const manifest = await service.compact({
      level: 'trim',
      events: sampleEvents,
      objective: 'Complete task-1',
      acceptedPlan: ['step 1', 'step 2'],
      decisions: [{ id: 'dec-1', title: 'Use approach A', rationale: 'faster iteration' }],
      unresolved: ['review pending'],
      artifacts: ['output.json'],
      taskId: 'task-1',
      runtimeSessionId: 'session-e2e',
    });

    // 3. Verify manifest exists and validates
    const manifestPath = path.join(contextBasePath, 'compaction-manifest.json');
    const manifestRaw = await fs.readFile(manifestPath, 'utf-8');
    const manifestParsed = JSON.parse(manifestRaw);
    const manifestValidation = CompactionManifestSchema.safeParse(manifestParsed);
    expect(manifestValidation.success).toBe(true);
    expect(manifest.validation.passed).toBe(true);

    // 4. Verify session-summary.json was produced
    const summaryPath = path.join(contextBasePath, 'session-summary.json');
    const summaryRaw = await fs.readFile(summaryPath, 'utf-8');
    const summaryParsed = JSON.parse(summaryRaw);
    expect(summaryParsed.objective).toBe('Complete task-1');

    // 5. Verify active-context.json was produced
    const contextPath = path.join(contextBasePath, 'active-context.json');
    const contextRaw = await fs.readFile(contextPath, 'utf-8');
    const contextParsed = JSON.parse(contextRaw);
    expect(contextParsed.objective).toBe('Complete task-1');

    // 6. Verify delta-summary.json was produced
    const deltaPath = path.join(contextBasePath, 'delta-summary.json');
    const deltaRaw = await fs.readFile(deltaPath, 'utf-8');
    const deltaParsed = JSON.parse(deltaRaw);
    expect(deltaParsed.status).toBe('compacted');

    // 7. Now test memory rotation on top: write a large memory.md and rotate it
    const charBudget = SIZE_BUDGET.hardCapTokens * SIZE_BUDGET.charsPerToken;
    const largeMemory = [
      '# Session Memory',
      '',
      '## Current Objective',
      'Complete task-1 ' + 'x'.repeat(charBudget),
      '',
      '## Current State',
      '- artifacts generated',
      '',
      '## Accepted Decisions',
      '- use approach A',
      '',
      '## Constraints',
      '',
      '## Open Questions / Blockers',
      '- review pending',
      '',
      '## Next Best Actions',
      '- run final checks',
      '',
      '## Canonical References',
      '- output.json',
    ].join('\n');

    await fs.writeFile(path.join(tmpDir, 'MEMORY.md'), largeMemory, 'utf-8');

    const runtimePath = path.join(tmpDir, '.hforge/runtime');
    const rotationResult = await rotateMemory(tmpDir, runtimePath);
    expect(rotationResult.archived).toBe(true);
    expect(rotationResult.archivePath).toBeDefined();

    // Verify archive file exists
    const archiveStat = await fs.stat(rotationResult.archivePath!);
    expect(archiveStat.isFile()).toBe(true);

    // 8. Write session summary via the memory session writer
    const memorySummary: MemorySessionSummary = {
      objective: 'Complete task-1',
      state: ['artifacts generated'],
      decisions: ['use approach A'],
      constraints: [],
      blockers: ['review pending'],
      nextActions: ['run final checks'],
      references: ['output.json'],
    };

    await writeSessionSummary(runtimePath, memorySummary);

    const memoryStatePath = path.join(runtimePath, 'memory-state.json');
    const memoryStateRaw = await fs.readFile(memoryStatePath, 'utf-8');
    const memoryStateParsed = JSON.parse(memoryStateRaw);
    expect(memoryStateParsed.objective).toBe('Complete task-1');
  });
});
