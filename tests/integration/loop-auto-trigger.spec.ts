import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { BehaviorEventEmitter } from '@app/behavior/behavior-event-emitter.js';
import { SessionRecorder } from '@app/loop/session-recorder.js';
import { scoreSession } from '@app/loop/effectiveness-scorer.js';
import { writeTrace, appendScore, readTraces, countTracesSinceLastExtraction } from '@app/loop/trace-store.js';
import { shouldExtract, loadPatterns } from '@app/loop/insight-store.js';
import { extractPatterns } from '@app/loop/pattern-extractor.js';
import { LOOP_PATTERN_EXTRACT_INTERVAL } from '@shared/constants.js';

/**
 * Helper: create a minimal session trace+score for a given session index.
 * Writes trace file and appends score to the ledger.
 */
async function writeSessionTraceAndScore(
  tmpDir: string,
  index: number,
): Promise<{ traceId: string; score: number }> {
  const sessionId = `auto-trigger-session-${index}`;
  const emitter = new BehaviorEventEmitter(sessionId);
  const recorder = new SessionRecorder(sessionId, 'claude-code', 'test-repo');

  emitter.onEvent((event) => recorder.recordEvent(event));

  emitter.emitSessionStarted({ sessionId });
  emitter.emitCompaction({
    tokensBeforeAfter: { before: 10000, after: 7000 },
  });
  emitter.emitBudgetWarning({
    budgetState: { estimatedTokens: 50000, hardCap: 100000 },
  });
  emitter.emitSessionEnded({ sessionId });

  const trace = recorder.buildTrace();
  const scoreResult = scoreSession(trace);

  await writeTrace(tmpDir, trace);
  await appendScore(tmpDir, scoreResult);

  return { traceId: trace.traceId, score: scoreResult.score };
}

describe('Loop Auto-Trigger', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-auto-trigger-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('shouldExtract returns true when trace count meets the interval', () => {
    expect(shouldExtract(LOOP_PATTERN_EXTRACT_INTERVAL)).toBe(true);
    expect(shouldExtract(LOOP_PATTERN_EXTRACT_INTERVAL + 1)).toBe(true);
    expect(shouldExtract(10)).toBe(true);
  });

  it('shouldExtract returns false when trace count is below the interval', () => {
    expect(shouldExtract(0)).toBe(false);
    expect(shouldExtract(LOOP_PATTERN_EXTRACT_INTERVAL - 1)).toBe(false);
  });

  it('after writing 5 traces, countTracesSinceLastExtraction returns 5', async () => {
    for (let i = 0; i < 5; i++) {
      await writeSessionTraceAndScore(tmpDir, i);
    }

    const count = await countTracesSinceLastExtraction(tmpDir);
    expect(count).toBe(5);
  });

  it('after writing 4 traces, auto-extraction should not trigger', async () => {
    for (let i = 0; i < 4; i++) {
      await writeSessionTraceAndScore(tmpDir, i);
    }

    const count = await countTracesSinceLastExtraction(tmpDir);
    expect(shouldExtract(count)).toBe(false);
  });

  it('after writing 5 traces, auto-extraction should trigger', async () => {
    for (let i = 0; i < 5; i++) {
      await writeSessionTraceAndScore(tmpDir, i);
    }

    const count = await countTracesSinceLastExtraction(tmpDir);
    expect(shouldExtract(count)).toBe(true);
  });

  it('extractPatterns returns patterns from accumulated traces', async () => {
    // Write enough traces for extractors to work with
    for (let i = 0; i < 5; i++) {
      await writeSessionTraceAndScore(tmpDir, i);
    }

    const patterns = await extractPatterns(tmpDir);
    // patterns may or may not be found depending on data variance,
    // but the function must return an array without throwing
    expect(Array.isArray(patterns)).toBe(true);
  });

  it('emitter fires loop.trace.recorded with traceId and score', () => {
    const emitter = new BehaviorEventEmitter('emit-test');
    const events: unknown[] = [];
    emitter.onEvent((evt) => events.push(evt));

    const event = emitter.emitLoopTraceRecorded({
      traceId: 'trace_abc123',
      score: 72,
    });

    expect(event.eventType).toBe('loop.trace.recorded');
    expect(event.payload.traceId).toBe('trace_abc123');
    expect(event.payload.score).toBe(72);
    expect(events.length).toBe(1);
  });

  it('emitter fires loop.pattern.extracted with patternCount and newPatterns', () => {
    const emitter = new BehaviorEventEmitter('emit-test');

    const event = emitter.emitLoopPatternExtracted({
      patternCount: 3,
      newPatterns: 2,
    });

    expect(event.eventType).toBe('loop.pattern.extracted');
    expect(event.payload.patternCount).toBe(3);
    expect(event.payload.newPatterns).toBe(2);
  });

  it('emitter fires loop.tuning.applied with tuning details', () => {
    const emitter = new BehaviorEventEmitter('emit-test');

    const event = emitter.emitLoopTuningApplied({
      tuningId: 'tuning_001',
      parameter: 'compaction_trigger_threshold',
      oldValue: 0.7,
      newValue: 0.85,
    });

    expect(event.eventType).toBe('loop.tuning.applied');
    expect(event.payload.tuningId).toBe('tuning_001');
    expect(event.payload.parameter).toBe('compaction_trigger_threshold');
    expect(event.payload.oldValue).toBe(0.7);
    expect(event.payload.newValue).toBe(0.85);
  });

  it('emitter fires loop.tuning.reverted with tuning details', () => {
    const emitter = new BehaviorEventEmitter('emit-test');

    const event = emitter.emitLoopTuningReverted({
      tuningId: 'tuning_001',
      parameter: 'compaction_trigger_threshold',
    });

    expect(event.eventType).toBe('loop.tuning.reverted');
    expect(event.payload.tuningId).toBe('tuning_001');
  });

  it('emitter fires loop.bundle.exported with bundleId and outputPath', () => {
    const emitter = new BehaviorEventEmitter('emit-test');

    const event = emitter.emitLoopBundleExported({
      bundleId: 'bundle_xyz',
      outputPath: '/tmp/export.hfb',
    });

    expect(event.eventType).toBe('loop.bundle.exported');
    expect(event.payload.bundleId).toBe('bundle_xyz');
    expect(event.payload.outputPath).toBe('/tmp/export.hfb');
  });

  it('emitter fires loop.bundle.imported with merge stats', () => {
    const emitter = new BehaviorEventEmitter('emit-test');

    const event = emitter.emitLoopBundleImported({
      bundleId: 'bundle_xyz',
      patternsAdded: 3,
      patternsUpdated: 1,
    });

    expect(event.eventType).toBe('loop.bundle.imported');
    expect(event.payload.bundleId).toBe('bundle_xyz');
    expect(event.payload.patternsAdded).toBe(3);
    expect(event.payload.patternsUpdated).toBe(1);
  });

  it('full auto-trigger pipeline: 5 sessions triggers extraction and saves patterns', async () => {
    // Simulate 5 sessions
    for (let i = 0; i < 5; i++) {
      await writeSessionTraceAndScore(tmpDir, i);
    }

    // Verify the auto-trigger condition is met
    const count = await countTracesSinceLastExtraction(tmpDir);
    expect(shouldExtract(count)).toBe(true);

    // Simulate what finalizeSessionTrace would do on auto-trigger
    const patterns = await extractPatterns(tmpDir);
    const { savePatterns } = await import('@app/loop/insight-store.js');
    await savePatterns(tmpDir, patterns);

    // Patterns file should now exist (may be empty array if no extractors find patterns)
    const loaded = await loadPatterns(tmpDir);
    expect(Array.isArray(loaded)).toBe(true);
  });
});
