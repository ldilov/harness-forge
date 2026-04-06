import { describe, expect, it } from 'vitest';
import { SessionRecorder } from '@app/loop/session-recorder.js';
import type { BehaviorEvent } from '@app/behavior/behavior-event-emitter.js';

function makeEvent(
  eventType: string,
  payload: Record<string, unknown> = {},
  occurredAt = '2026-04-06T10:00:00.000Z',
): BehaviorEvent {
  return {
    eventType,
    occurredAt,
    payload,
  } as unknown as BehaviorEvent;
}

describe('SessionRecorder', () => {
  const SESSION_ID = 'rsn_test123';
  const TARGET = 'claude';
  const REPO = 'harness-forge';

  it('creates empty trace on construction with zero metrics', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);
    const trace = recorder.buildTrace();

    expect(trace.traceId).toMatch(/^trc_[0-9a-f]{24}$/);
    expect(trace.sessionId).toBe(SESSION_ID);
    expect(trace.target).toBe(TARGET);
    expect(trace.repo).toBe(REPO);
    expect(trace.compactionsTriggered).toBe(0);
    expect(trace.tokensSaved).toBe(0);
    expect(trace.compactionStrategies).toEqual([]);
    expect(trace.budgetExceeded).toBe(false);
    expect(trace.tokensUsed).toBe(0);
    expect(trace.subagentsSpawned).toBe(0);
    expect(trace.duplicatesSuppressed).toBe(0);
    expect(trace.commandsRun).toEqual([]);
    expect(trace.errorsEncountered).toBe(0);
    expect(trace.durationMs).toBe(0);
  });

  it('accumulates compaction metrics from compaction events', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);

    recorder.recordEvent(makeEvent('context.compaction.completed', {
      tokensBeforeAfter: { before: 10000, after: 6000 },
      strategy: 'summarize',
    }));
    recorder.recordEvent(makeEvent('context.compaction.completed', {
      tokensBeforeAfter: { before: 8000, after: 5000 },
      strategy: 'trim',
    }));

    const trace = recorder.buildTrace();
    expect(trace.compactionsTriggered).toBe(2);
    expect(trace.tokensSaved).toBe(7000); // (10000-6000) + (8000-5000)
    expect(trace.compactionStrategies).toEqual(['summarize', 'trim']);
  });

  it('tracks budget exceeded from budget events', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);

    recorder.recordEvent(makeEvent('context.budget.exceeded', {
      budgetState: { estimatedTokens: 120000, hardCap: 100000 },
    }));

    const trace = recorder.buildTrace();
    expect(trace.budgetExceeded).toBe(true);
  });

  it('updates tokensUsed from budget warning events', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);

    recorder.recordEvent(makeEvent('context.budget.warning', {
      budgetState: { estimatedTokens: 85000, hardCap: 100000 },
    }));

    const trace = recorder.buildTrace();
    expect(trace.tokensUsed).toBe(85000);
  });

  it('tracks commands from command events', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);

    recorder.recordEvent(makeEvent('command.completed', { commandName: 'install' }));
    recorder.recordEvent(makeEvent('command.completed', { commandName: 'build' }));
    recorder.recordEvent(makeEvent('command.failed', { commandName: 'test' }));

    const trace = recorder.buildTrace();
    expect(trace.commandsRun).toEqual(['install', 'build', 'test']);
    expect(trace.errorsEncountered).toBe(1); // command.failed
  });

  it('computes duration from session start/end timestamps', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);

    recorder.recordEvent(makeEvent(
      'session.started',
      {},
      '2026-04-06T10:00:00.000Z',
    ));
    recorder.recordEvent(makeEvent(
      'session.ended',
      {},
      '2026-04-06T10:05:30.000Z',
    ));

    const trace = recorder.buildTrace();
    expect(trace.durationMs).toBe(330000); // 5min 30sec
    expect(trace.startedAt).toBe('2026-04-06T10:00:00.000Z');
    expect(trace.endedAt).toBe('2026-04-06T10:05:30.000Z');
  });

  it('increments errors from failed/rejected/denied events', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);

    recorder.recordEvent(makeEvent('command.failed', { commandName: 'deploy' }));
    recorder.recordEvent(makeEvent('subagent.brief.rejected', {}));
    recorder.recordEvent(makeEvent('history.expansion.denied', {}));

    const trace = recorder.buildTrace();
    expect(trace.errorsEncountered).toBe(3);
  });

  it('tracks subagent spawns', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);

    recorder.recordEvent(makeEvent('subagent.run.started', {}));
    recorder.recordEvent(makeEvent('subagent.run.started', {}));

    const trace = recorder.buildTrace();
    expect(trace.subagentsSpawned).toBe(2);
  });

  it('tracks duplicates suppressed', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);

    recorder.recordEvent(makeEvent('context.duplicate.suppressed', {
      suppressionCounts: { total: 10, suppressed: 3 },
    }));

    const trace = recorder.buildTrace();
    expect(trace.duplicatesSuppressed).toBe(1);
  });

  it('accumulates multiple events correctly', () => {
    const recorder = new SessionRecorder(SESSION_ID, TARGET, REPO);

    recorder.recordEvent(makeEvent('session.started', {}, '2026-04-06T09:00:00.000Z'));
    recorder.recordEvent(makeEvent('context.compaction.completed', {
      tokensBeforeAfter: { before: 10000, after: 7000 },
      strategy: 'summarize',
    }));
    recorder.recordEvent(makeEvent('subagent.run.started', {}));
    recorder.recordEvent(makeEvent('command.completed', { commandName: 'lint' }));
    recorder.recordEvent(makeEvent('command.failed', { commandName: 'build' }));
    recorder.recordEvent(makeEvent('context.budget.warning', {
      budgetState: { estimatedTokens: 90000, hardCap: 100000 },
    }));
    recorder.recordEvent(makeEvent('context.duplicate.suppressed', {
      suppressionCounts: { total: 5, suppressed: 2 },
    }));
    recorder.recordEvent(makeEvent('session.ended', {}, '2026-04-06T09:30:00.000Z'));

    const trace = recorder.buildTrace();
    expect(trace.compactionsTriggered).toBe(1);
    expect(trace.tokensSaved).toBe(3000);
    expect(trace.compactionStrategies).toEqual(['summarize']);
    expect(trace.subagentsSpawned).toBe(1);
    expect(trace.commandsRun).toEqual(['lint', 'build']);
    expect(trace.errorsEncountered).toBe(1); // command.failed
    expect(trace.tokensUsed).toBe(90000);
    expect(trace.duplicatesSuppressed).toBe(1);
    expect(trace.durationMs).toBe(1800000); // 30 min
    expect(trace.budgetExceeded).toBe(false);
  });
});
