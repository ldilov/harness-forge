import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { BehaviorEventEmitter } from '@app/behavior/behavior-event-emitter.js';
import {
  createPersistenceListener,
  createNdjsonPersistenceListener,
  readNdjsonEvents,
} from '@app/behavior/event-persistence-listener.js';
import { SignalAggregator } from '@app/dashboard/signal-aggregator.js';
import type { SignalMessage } from '@domain/dashboard/signal-types.js';

describe('Pipeline E2E: emitter → persistence → aggregator', () => {
  let tmpDir: string;
  let obsDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-pipeline-e2e-'));
    obsDir = path.join(tmpDir, '.hforge', 'observability');
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('events flow from emitter to JSON persistence', async () => {
    const eventsJsonPath = path.join(obsDir, 'events.json');
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(createPersistenceListener(eventsJsonPath));

    emitter.emitSessionStarted({ sessionId: 'test', version: '1.0.0' });
    emitter.emitCommandStarted({ command: 'install' });
    emitter.emitInstallPlanCreated({ operationCount: 3, targetId: 'codex' });
    emitter.emitCommandCompleted({ command: 'install', durationMs: 500, exitCode: 0 });
    emitter.emitSessionEnded({ sessionId: 'test', totalDurationMs: 600 });

    await new Promise((r) => setTimeout(r, 300));

    const content = await fs.readFile(eventsJsonPath, 'utf8');
    const events = JSON.parse(content) as Array<{ eventType: string; payload: Record<string, unknown> }>;

    expect(events).toHaveLength(5);
    expect(events.map((e) => e.eventType)).toEqual([
      'session.started',
      'command.started',
      'install.plan.created',
      'command.completed',
      'session.ended',
    ]);
    expect(events[2]!.payload.operationCount).toBe(3);
    expect(events[3]!.payload.durationMs).toBe(500);
  });

  it('events flow from emitter to NDJSON persistence', async () => {
    const ndjsonPath = path.join(obsDir, 'events.ndjson');
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(createNdjsonPersistenceListener(ndjsonPath));

    emitter.emitCommandStarted({ command: 'compact' });
    emitter.emitCompactionTriggered({ level: 'trim' });
    emitter.emitCommandCompleted({ command: 'compact', durationMs: 200 });

    await new Promise((r) => setTimeout(r, 200));

    const events = await readNdjsonEvents(ndjsonPath);
    expect(events).toHaveLength(3);
    expect(events.map((e) => e.eventType)).toEqual([
      'command.started',
      'context.compaction.triggered',
      'command.completed',
    ]);
  });

  it('dual-format persistence writes both JSON and NDJSON', async () => {
    const jsonPath = path.join(obsDir, 'events.json');
    const ndjsonPath = path.join(obsDir, 'events.ndjson');
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(createPersistenceListener(jsonPath));
    emitter.onEvent(createNdjsonPersistenceListener(ndjsonPath));

    emitter.emitWorkspaceDiscoveryCompleted({ targetsFound: ['codex', 'claude-code'] });
    emitter.emitRecommendationGenerated({ bundles: ['lang:typescript'], source: 'heuristic' });

    await new Promise((r) => setTimeout(r, 300));

    const jsonEvents = JSON.parse(await fs.readFile(jsonPath, 'utf8')) as unknown[];
    const ndjsonEvents = await readNdjsonEvents(ndjsonPath);

    expect(jsonEvents).toHaveLength(2);
    expect(ndjsonEvents).toHaveLength(2);
  });

  it('persisted events can be consumed by SignalAggregator', async () => {
    const jsonPath = path.join(obsDir, 'events.json');
    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(createPersistenceListener(jsonPath));

    emitter.emitBudgetWarning({
      budgetState: { estimatedTokens: 3200, hardCap: 4000 },
      enforcementLevel: 'nudge',
    });
    emitter.emitCompaction({
      tokensBeforeAfter: { before: 3200, after: 1800 },
      level: 'trim',
      durationMs: 150,
    });

    await new Promise((r) => setTimeout(r, 300));

    // Now read persisted events and feed them to aggregator
    const content = await fs.readFile(jsonPath, 'utf8');
    const events = JSON.parse(content) as Array<Record<string, unknown>>;

    const signals: SignalMessage[] = [];
    const sink = { send: (s: SignalMessage) => signals.push(s), updateState: () => {} };
    const aggregator = new SignalAggregator(sink);

    for (const event of events) {
      aggregator.handleEvent(event as any);
    }

    // Should have produced event signals + metric signals
    expect(signals.length).toBeGreaterThan(2);

    const eventSignals = signals.filter((s) => s.type === 'event');
    const metricSignals = signals.filter((s) => s.type === 'metric');

    expect(eventSignals.length).toBeGreaterThanOrEqual(2);
    expect(metricSignals.length).toBeGreaterThan(0);

    // Budget metrics should be derived
    const budgetMetric = metricSignals.find(
      (s) => (s.payload as Record<string, unknown>).name === 'budget.usage.percent',
    );
    expect(budgetMetric).toBeDefined();
    expect((budgetMetric!.payload as Record<string, unknown>).value).toBe(80); // 3200/4000 * 100

    // Compaction savings
    const savedMetric = metricSignals.find(
      (s) => (s.payload as Record<string, unknown>).name === 'compaction.tokens.saved',
    );
    expect(savedMetric).toBeDefined();
    expect((savedMetric!.payload as Record<string, unknown>).value).toBe(1400); // 3200 - 1800
  });

  it('dynamic path resolver tracks --root changes', async () => {
    const dir1 = path.join(tmpDir, 'project1', '.hforge', 'observability');
    const dir2 = path.join(tmpDir, 'project2', '.hforge', 'observability');

    let currentRoot = path.join(tmpDir, 'project1');
    const resolver = () => path.join(currentRoot, '.hforge', 'observability', 'events.json');

    const emitter = new BehaviorEventEmitter('test-session');
    emitter.onEvent(createPersistenceListener(resolver));

    emitter.emitCommandStarted({ command: 'install' });
    await new Promise((r) => setTimeout(r, 150));

    // Switch root mid-session (simulates --root flag being parsed)
    currentRoot = path.join(tmpDir, 'project2');

    emitter.emitCommandStarted({ command: 'compact' });
    await new Promise((r) => setTimeout(r, 150));

    // Events should be in different directories
    const events1 = JSON.parse(await fs.readFile(path.join(dir1, 'events.json'), 'utf8')) as unknown[];
    const events2 = JSON.parse(await fs.readFile(path.join(dir2, 'events.json'), 'utf8')) as unknown[];

    expect(events1).toHaveLength(1);
    expect(events2).toHaveLength(1);
  });
});
