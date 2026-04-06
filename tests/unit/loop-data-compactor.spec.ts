import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { classifyTier, compactLoopData, readDigests } from '@app/loop/loop-data-compactor.js';
import type { SessionTrace } from '@domain/loop/session-trace.js';
import type { EffectivenessScore } from '@domain/loop/effectiveness-score.js';
import type { LoopRetentionPolicy } from '@domain/loop/retention-policy.js';
import {
  RUNTIME_DIR,
  RUNTIME_TRACES_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_EFFECTIVENESS_LEDGER_FILE,
  RUNTIME_TUNING_LOG_FILE,
  RUNTIME_INSIGHTS_CHANGELOG_FILE,
  RUNTIME_MERGE_LOG_FILE,
  RUNTIME_TRACE_DIGESTS_DIR,
} from '@shared/constants.js';

let tmpDir: string;

function tracesDir(): string {
  return path.join(tmpDir, RUNTIME_DIR, RUNTIME_TRACES_DIR);
}

function insightsDir(): string {
  return path.join(tmpDir, RUNTIME_DIR, RUNTIME_INSIGHTS_DIR);
}

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

function makeTrace(overrides: Partial<SessionTrace> & { sessionId: string; startedAt: string }): SessionTrace {
  return {
    traceId: `trc_${overrides.sessionId}`,
    sessionId: overrides.sessionId,
    target: 'claude-code',
    repo: 'test-repo',
    startedAt: overrides.startedAt,
    endedAt: overrides.endedAt ?? overrides.startedAt,
    durationSeconds: overrides.durationSeconds ?? 120,
    metrics: {
      tokensUsed: overrides.metrics?.tokensUsed ?? 5000,
      tokenBudget: overrides.metrics?.tokenBudget ?? 100000,
      compactionsTriggered: overrides.metrics?.compactionsTriggered ?? 1,
      compactionStrategies: overrides.metrics?.compactionStrategies ?? ['trim'],
      tokensSaved: overrides.metrics?.tokensSaved ?? 2000,
      subagentsSpawned: overrides.metrics?.subagentsSpawned ?? 0,
      duplicatesSuppressed: overrides.metrics?.duplicatesSuppressed ?? 0,
      skillsInvoked: overrides.metrics?.skillsInvoked ?? [],
      commandsRun: overrides.metrics?.commandsRun ?? [],
      errorsEncountered: overrides.metrics?.errorsEncountered ?? 0,
    },
    outcome: {
      taskCompleted: true,
      retries: 0,
      userCorrections: 0,
      budgetExceeded: false,
      ...overrides.outcome,
    },
  };
}

function makeScore(sessionId: string, score: number): EffectivenessScore {
  return {
    sessionId,
    traceId: `trc_${sessionId}`,
    score,
    breakdown: {
      tokenEfficiency: score,
      taskCompletion: score,
      compactionHealth: score,
      errorRate: score,
      userFriction: score,
    },
    scoredAt: new Date().toISOString(),
    repo: 'test-repo',
    target: 'claude-code',
  };
}

async function writeTraceFile(trace: SessionTrace): Promise<void> {
  const dir = tracesDir();
  await fs.mkdir(dir, { recursive: true });
  const filePath = path.join(dir, `session-${trace.sessionId}.trace.json`);
  await fs.writeFile(filePath, JSON.stringify(trace, null, 2), 'utf-8');
}

async function writeLedger(scores: readonly EffectivenessScore[]): Promise<void> {
  const dir = insightsDir();
  await fs.mkdir(dir, { recursive: true });
  const lines = scores.map((s) => JSON.stringify(s)).join('\n') + '\n';
  await fs.writeFile(path.join(dir, RUNTIME_EFFECTIVENESS_LEDGER_FILE), lines, 'utf-8');
}

async function writeNdjsonLog(fileName: string, entries: readonly Record<string, unknown>[]): Promise<void> {
  const dir = insightsDir();
  await fs.mkdir(dir, { recursive: true });
  const lines = entries.map((e) => JSON.stringify(e)).join('\n') + '\n';
  await fs.writeFile(path.join(dir, fileName), lines, 'utf-8');
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'loop-compactor-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('classifyTier', () => {
  const defaultPolicy: LoopRetentionPolicy = { hotDays: 30, warmDays: 90 };

  it('returns hot for today\'s trace', () => {
    const now = new Date();
    const result = classifyTier(now.toISOString(), now, defaultPolicy);
    expect(result).toBe('hot');
  });

  it('returns hot for a trace 29 days old', () => {
    const now = new Date();
    const traceDate = daysAgo(29);
    const result = classifyTier(traceDate.toISOString(), now, defaultPolicy);
    expect(result).toBe('hot');
  });

  it('returns warm for 45-day-old trace with default 30-day hot', () => {
    const now = new Date();
    const traceDate = daysAgo(45);
    const result = classifyTier(traceDate.toISOString(), now, defaultPolicy);
    expect(result).toBe('warm');
  });

  it('returns cold for 100-day-old trace with default 90-day warm', () => {
    const now = new Date();
    const traceDate = daysAgo(100);
    const result = classifyTier(traceDate.toISOString(), now, defaultPolicy);
    expect(result).toBe('cold');
  });

  it('respects custom policy boundaries', () => {
    const now = new Date();
    const customPolicy: LoopRetentionPolicy = { hotDays: 7, warmDays: 30 };

    expect(classifyTier(daysAgo(5).toISOString(), now, customPolicy)).toBe('hot');
    expect(classifyTier(daysAgo(15).toISOString(), now, customPolicy)).toBe('warm');
    expect(classifyTier(daysAgo(45).toISOString(), now, customPolicy)).toBe('cold');
  });
});

describe('compactLoopData', () => {
  it('returns zero result for empty traces dir', async () => {
    const result = await compactLoopData(tmpDir);
    expect(result.tracesCompacted).toBe(0);
    expect(result.tracesDeleted).toBe(0);
    expect(result.digestsCreated).toBe(0);
    expect(result.bytesFreed).toBe(0);
  });

  it('preserves hot traces untouched', async () => {
    const hotTrace = makeTrace({
      sessionId: 'hot-session-1',
      startedAt: new Date().toISOString(),
    });
    await writeTraceFile(hotTrace);

    const result = await compactLoopData(tmpDir);
    expect(result.tracesCompacted).toBe(0);
    expect(result.tracesDeleted).toBe(0);

    // Verify file still exists
    const files = await fs.readdir(tracesDir());
    expect(files).toContain('session-hot-session-1.trace.json');
  });

  it('creates daily digest for warm traces', async () => {
    const warmDate = daysAgo(45);
    const dateStr = warmDate.toISOString();
    const dateKey = dateStr.slice(0, 10);

    const trace1 = makeTrace({
      sessionId: 'warm-1',
      startedAt: dateStr,
      metrics: {
        tokensUsed: 3000,
        tokenBudget: 100000,
        compactionsTriggered: 2,
        compactionStrategies: ['trim'],
        tokensSaved: 1000,
        subagentsSpawned: 0,
        duplicatesSuppressed: 0,
        skillsInvoked: [],
        commandsRun: [],
        errorsEncountered: 1,
      },
    });
    const trace2 = makeTrace({
      sessionId: 'warm-2',
      startedAt: dateStr,
      metrics: {
        tokensUsed: 7000,
        tokenBudget: 100000,
        compactionsTriggered: 1,
        compactionStrategies: ['summarize'],
        tokensSaved: 3000,
        subagentsSpawned: 0,
        duplicatesSuppressed: 0,
        skillsInvoked: [],
        commandsRun: [],
        errorsEncountered: 2,
      },
    });

    await writeTraceFile(trace1);
    await writeTraceFile(trace2);
    await writeLedger([
      makeScore('warm-1', 60),
      makeScore('warm-2', 80),
    ]);

    const result = await compactLoopData(tmpDir);
    expect(result.tracesCompacted).toBe(2);
    expect(result.digestsCreated).toBe(1);
    expect(result.bytesFreed).toBeGreaterThan(0);

    // Verify trace files are deleted
    const files = await fs.readdir(tracesDir());
    const traceFiles = files.filter((f) => f.endsWith('.trace.json'));
    expect(traceFiles).toHaveLength(0);

    // Verify digest was created
    const digests = await readDigests(tmpDir);
    expect(digests).toHaveLength(1);
    expect(digests[0]!.date).toBe(dateKey);
  });

  it('deletes cold trace files', async () => {
    const coldTrace = makeTrace({
      sessionId: 'cold-1',
      startedAt: daysAgo(100).toISOString(),
    });
    await writeTraceFile(coldTrace);

    const result = await compactLoopData(tmpDir);
    expect(result.tracesDeleted).toBe(1);
    expect(result.bytesFreed).toBeGreaterThan(0);

    // Verify file is gone
    const files = await fs.readdir(tracesDir());
    expect(files.filter((f) => f.endsWith('.trace.json'))).toHaveLength(0);
  });

  it('daily digest has correct aggregated values', async () => {
    const warmDate = daysAgo(45);
    const dateStr = warmDate.toISOString();

    const trace1 = makeTrace({
      sessionId: 'agg-1',
      startedAt: dateStr,
      metrics: {
        tokensUsed: 4000,
        tokenBudget: 100000,
        compactionsTriggered: 2,
        compactionStrategies: ['trim', 'summarize'],
        tokensSaved: 1500,
        subagentsSpawned: 0,
        duplicatesSuppressed: 0,
        skillsInvoked: [],
        commandsRun: [],
        errorsEncountered: 1,
      },
    });
    const trace2 = makeTrace({
      sessionId: 'agg-2',
      startedAt: dateStr,
      metrics: {
        tokensUsed: 6000,
        tokenBudget: 100000,
        compactionsTriggered: 3,
        compactionStrategies: ['rollup'],
        tokensSaved: 2500,
        subagentsSpawned: 0,
        duplicatesSuppressed: 0,
        skillsInvoked: [],
        commandsRun: [],
        errorsEncountered: 2,
      },
    });

    await writeTraceFile(trace1);
    await writeTraceFile(trace2);
    await writeLedger([
      makeScore('agg-1', 70),
      makeScore('agg-2', 90),
    ]);

    await compactLoopData(tmpDir);

    const digests = await readDigests(tmpDir);
    expect(digests).toHaveLength(1);
    const digest = digests[0]!;

    expect(digest.sessionCount).toBe(2);
    expect(digest.avgScore).toBe(80);
    expect(digest.totalTokensUsed).toBe(10000);
    expect(digest.totalTokensSaved).toBe(4000);
    expect(digest.compactionCount).toBe(5);
    expect(digest.topStrategies).toEqual(expect.arrayContaining(['trim', 'summarize', 'rollup']));
    expect(digest.errorCount).toBe(3);
  });

  it('trims NDJSON logs to retention window', async () => {
    const oldEntry = { appliedAt: daysAgo(100).toISOString(), parameter: 'old' };
    const recentEntry = { appliedAt: daysAgo(10).toISOString(), parameter: 'recent' };
    await writeNdjsonLog(RUNTIME_TUNING_LOG_FILE, [oldEntry, recentEntry]);

    const oldChangelog = { extractedAt: daysAgo(100).toISOString(), patternCount: 1, patternIds: ['old'] };
    const recentChangelog = { extractedAt: daysAgo(10).toISOString(), patternCount: 2, patternIds: ['new1', 'new2'] };
    await writeNdjsonLog(RUNTIME_INSIGHTS_CHANGELOG_FILE, [oldChangelog, recentChangelog]);

    const oldMerge = { timestamp: daysAgo(100).toISOString(), event: 'old-merge' };
    const recentMerge = { timestamp: daysAgo(10).toISOString(), event: 'new-merge' };
    await writeNdjsonLog(RUNTIME_MERGE_LOG_FILE, [oldMerge, recentMerge]);

    const result = await compactLoopData(tmpDir);
    expect(result.bytesFreed).toBeGreaterThan(0);

    // Verify tuning-log only has recent entry
    const tuningContent = await fs.readFile(
      path.join(insightsDir(), RUNTIME_TUNING_LOG_FILE),
      'utf-8',
    );
    const tuningLines = tuningContent.split('\n').filter((l) => l.trim());
    expect(tuningLines).toHaveLength(1);
    expect(JSON.parse(tuningLines[0]!)).toMatchObject({ parameter: 'recent' });

    // Verify changelog only has recent entry
    const changelogContent = await fs.readFile(
      path.join(insightsDir(), RUNTIME_INSIGHTS_CHANGELOG_FILE),
      'utf-8',
    );
    const changelogLines = changelogContent.split('\n').filter((l) => l.trim());
    expect(changelogLines).toHaveLength(1);

    // Verify merge-log only has recent entry
    const mergeContent = await fs.readFile(
      path.join(insightsDir(), RUNTIME_MERGE_LOG_FILE),
      'utf-8',
    );
    const mergeLines = mergeContent.split('\n').filter((l) => l.trim());
    expect(mergeLines).toHaveLength(1);
  });

  it('custom policy overrides defaults', async () => {
    const customPolicy: LoopRetentionPolicy = { hotDays: 7, warmDays: 30 };

    // 15-day-old trace: warm under custom (7-30), hot under default (30-90)
    const trace = makeTrace({
      sessionId: 'custom-1',
      startedAt: daysAgo(15).toISOString(),
    });
    await writeTraceFile(trace);
    await writeLedger([makeScore('custom-1', 75)]);

    const result = await compactLoopData(tmpDir, customPolicy);
    expect(result.tracesCompacted).toBe(1);
    expect(result.digestsCreated).toBe(1);
  });
});

describe('readDigests', () => {
  it('returns empty array when no digests exist', async () => {
    const digests = await readDigests(tmpDir);
    expect(digests).toEqual([]);
  });

  it('returns created digests after compaction', async () => {
    // Create two warm traces on different dates
    const date1 = daysAgo(45);
    const date2 = daysAgo(50);

    await writeTraceFile(makeTrace({ sessionId: 'dig-1', startedAt: date1.toISOString() }));
    await writeTraceFile(makeTrace({ sessionId: 'dig-2', startedAt: date2.toISOString() }));
    await writeLedger([makeScore('dig-1', 80), makeScore('dig-2', 60)]);

    await compactLoopData(tmpDir);

    const digests = await readDigests(tmpDir);
    expect(digests).toHaveLength(2);

    // Digests should be sorted by date (readDigests sorts by filename)
    const dates = digests.map((d) => d.date);
    const sortedDates = [...dates].sort();
    expect(dates).toEqual(sortedDates);
  });
});
