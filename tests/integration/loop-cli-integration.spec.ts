import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { BehaviorEventEmitter } from '@app/behavior/behavior-event-emitter.js';
import { SessionRecorder } from '@app/loop/session-recorder.js';
import { scoreSession } from '@app/loop/effectiveness-scorer.js';
import { writeTrace, appendScore, readTraces, readScores } from '@app/loop/trace-store.js';

describe('Loop CLI Integration', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-loop-int-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('SessionRecorder accumulates events emitted by BehaviorEventEmitter', () => {
    const emitter = new BehaviorEventEmitter('test-session-001');
    const recorder = new SessionRecorder('test-session-001', 'claude-code', 'my-repo');

    emitter.onEvent((event) => recorder.recordEvent(event));

    emitter.emitSessionStarted({ sessionId: 'test-session-001' });
    emitter.emitCompaction({
      tokensBeforeAfter: { before: 10000, after: 6000 },
    });
    emitter.emitBudgetWarning({
      budgetState: { estimatedTokens: 80000, hardCap: 100000 },
    });
    emitter.emitDuplicateSuppressed({
      suppressionCounts: { total: 5, suppressed: 2 },
    });
    emitter.emitSubagentRunStarted({});
    emitter.emitCommandCompleted({ command: 'install' });
    emitter.emitCommandFailed({ command: 'build', error: 'exit 1' });
    emitter.emitSessionEnded({ sessionId: 'test-session-001' });

    const trace = recorder.buildTrace();

    expect(trace.sessionId).toBe('test-session-001');
    expect(trace.target).toBe('claude-code');
    expect(trace.repo).toBe('my-repo');
    expect(trace.compactionsTriggered).toBe(1);
    expect(trace.tokensSaved).toBe(4000);
    expect(trace.tokensUsed).toBe(80000);
    expect(trace.duplicatesSuppressed).toBe(1);
    expect(trace.subagentsSpawned).toBe(1);
    expect(trace.errorsEncountered).toBe(1);
    expect(trace.durationMs).toBeGreaterThan(0);
    expect(trace.startedAt).toBeTruthy();
    expect(trace.endedAt).toBeTruthy();
  });

  it('finalizeSessionTrace pipeline writes trace and score files to workspace', async () => {
    const emitter = new BehaviorEventEmitter('test-session-002');
    const recorder = new SessionRecorder('test-session-002', 'codex', 'demo-repo');

    emitter.onEvent((event) => recorder.recordEvent(event));

    emitter.emitSessionStarted({ sessionId: 'test-session-002' });
    emitter.emitCompaction({
      tokensBeforeAfter: { before: 8000, after: 5000 },
    });
    emitter.emitBudgetWarning({
      budgetState: { estimatedTokens: 50000, hardCap: 100000 },
    });
    emitter.emitSessionEnded({ sessionId: 'test-session-002' });

    const trace = recorder.buildTrace();
    const score = scoreSession(trace);

    await writeTrace(tmpDir, trace);
    await appendScore(tmpDir, score);

    // Verify trace was persisted
    const traces = await readTraces(tmpDir);
    expect(traces.length).toBe(1);
    expect(traces[0]!.sessionId).toBe('test-session-002');
    expect(traces[0]!.target).toBe('codex');
    expect(traces[0]!.repo).toBe('demo-repo');
    expect(traces[0]!.compactionsTriggered).toBe(1);
    expect(traces[0]!.tokensSaved).toBe(3000);

    // Verify score was persisted
    const scores = await readScores(tmpDir);
    expect(scores.length).toBe(1);
    expect(scores[0]!.sessionId).toBe('test-session-002');
    expect(scores[0]!.score).toBeGreaterThanOrEqual(0);
    expect(scores[0]!.score).toBeLessThanOrEqual(100);
    expect(scores[0]!.breakdown).toBeDefined();
  });

  it('multiple sessions accumulate separate traces and scores', async () => {
    for (const id of ['sess-a', 'sess-b', 'sess-c']) {
      const emitter = new BehaviorEventEmitter(id);
      const recorder = new SessionRecorder(id, 'claude-code', 'test-repo');

      emitter.onEvent((event) => recorder.recordEvent(event));

      emitter.emitSessionStarted({ sessionId: id });
      emitter.emitSessionEnded({ sessionId: id });

      const trace = recorder.buildTrace();
      const score = scoreSession(trace);

      await writeTrace(tmpDir, trace);
      await appendScore(tmpDir, score);
    }

    const traces = await readTraces(tmpDir);
    expect(traces.length).toBe(3);

    const scores = await readScores(tmpDir);
    expect(scores.length).toBe(3);
  });

  it('recorder returns null-safe trace when no events are recorded', () => {
    const recorder = new SessionRecorder('empty-session', 'unknown', 'no-repo');
    const trace = recorder.buildTrace();

    expect(trace.sessionId).toBe('empty-session');
    expect(trace.compactionsTriggered).toBe(0);
    expect(trace.errorsEncountered).toBe(0);
    expect(trace.durationMs).toBe(0);

    const score = scoreSession(trace);
    expect(Number.isFinite(score.score)).toBe(true);
  });
});
