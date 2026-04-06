import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  writeTrace,
  readTraces,
  appendScore,
  readScores,
  countTracesSinceLastExtraction,
} from '../../src/application/loop/trace-store.js';
import type { SessionTrace } from '../../src/domain/loop/session-trace.js';
import type { EffectivenessScore } from '../../src/domain/loop/effectiveness-score.js';

function makeTrace(overrides: Partial<SessionTrace> = {}): SessionTrace {
  return {
    sessionId: 'sess-001',
    startedAt: '2026-04-06T10:00:00Z',
    endedAt: '2026-04-06T10:05:00Z',
    toolCalls: 12,
    filesChanged: ['src/foo.ts'],
    outcome: 'success',
    summary: 'Implemented feature X',
    ...overrides,
  };
}

function makeScore(overrides: Partial<EffectivenessScore> = {}): EffectivenessScore {
  return {
    sessionId: 'sess-001',
    scoredAt: '2026-04-06T10:06:00Z',
    overall: 0.85,
    dimensions: {
      correctness: 0.9,
      efficiency: 0.8,
      adherence: 0.85,
    },
    rationale: 'Good implementation with minor efficiency issues',
    ...overrides,
  };
}

describe('trace-store', () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'trace-store-'));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  describe('writeTrace', () => {
    it('creates the file at the expected path', async () => {
      const root = makeTempDir();
      const trace = makeTrace({ sessionId: 'sess-abc' });

      await writeTrace(root, trace);

      const expectedPath = join(root, '.hforge', 'runtime', 'traces', 'session-sess-abc.trace.json');
      const content = await readFile(expectedPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed).toEqual(trace);
    });
  });

  describe('readTraces', () => {
    it('returns written traces sorted by startedAt desc', async () => {
      const root = makeTempDir();
      const older = makeTrace({ sessionId: 'sess-old', startedAt: '2026-04-05T08:00:00Z' });
      const newer = makeTrace({ sessionId: 'sess-new', startedAt: '2026-04-06T12:00:00Z' });
      const middle = makeTrace({ sessionId: 'sess-mid', startedAt: '2026-04-06T09:00:00Z' });

      await writeTrace(root, older);
      await writeTrace(root, newer);
      await writeTrace(root, middle);

      const traces = await readTraces(root);
      expect(traces).toHaveLength(3);
      expect(traces[0]!.sessionId).toBe('sess-new');
      expect(traces[1]!.sessionId).toBe('sess-mid');
      expect(traces[2]!.sessionId).toBe('sess-old');
    });

    it('respects limit option', async () => {
      const root = makeTempDir();
      await writeTrace(root, makeTrace({ sessionId: 's1', startedAt: '2026-04-01T00:00:00Z' }));
      await writeTrace(root, makeTrace({ sessionId: 's2', startedAt: '2026-04-02T00:00:00Z' }));
      await writeTrace(root, makeTrace({ sessionId: 's3', startedAt: '2026-04-03T00:00:00Z' }));

      const traces = await readTraces(root, { limit: 2 });
      expect(traces).toHaveLength(2);
      expect(traces[0]!.sessionId).toBe('s3');
      expect(traces[1]!.sessionId).toBe('s2');
    });

    it('returns empty array for empty directory', async () => {
      const root = makeTempDir();
      const traces = await readTraces(root);
      expect(traces).toEqual([]);
    });
  });

  describe('appendScore', () => {
    it('appends to the NDJSON ledger', async () => {
      const root = makeTempDir();
      const score = makeScore();

      await appendScore(root, score);

      const ledgerPath = join(root, '.hforge', 'runtime', 'insights', 'effectiveness-ledger.ndjson');
      const content = await readFile(ledgerPath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      expect(lines).toHaveLength(1);
      expect(JSON.parse(lines[0]!)).toEqual(score);
    });
  });

  describe('readScores', () => {
    it('parses the NDJSON ledger correctly', async () => {
      const root = makeTempDir();
      const score1 = makeScore({ sessionId: 'sess-a', scoredAt: '2026-04-06T10:00:00Z' });
      const score2 = makeScore({ sessionId: 'sess-b', scoredAt: '2026-04-06T11:00:00Z' });

      await appendScore(root, score1);
      await appendScore(root, score2);

      const scores = await readScores(root);
      expect(scores).toHaveLength(2);
      expect(scores[0]!.sessionId).toBe('sess-a');
      expect(scores[1]!.sessionId).toBe('sess-b');
    });

    it('respects limit option', async () => {
      const root = makeTempDir();
      await appendScore(root, makeScore({ sessionId: 's1' }));
      await appendScore(root, makeScore({ sessionId: 's2' }));
      await appendScore(root, makeScore({ sessionId: 's3' }));

      const scores = await readScores(root, { limit: 2 });
      expect(scores).toHaveLength(2);
    });

    it('returns empty array when ledger does not exist', async () => {
      const root = makeTempDir();
      const scores = await readScores(root);
      expect(scores).toEqual([]);
    });
  });

  describe('countTracesSinceLastExtraction', () => {
    it('returns count of all traces when no changelog exists', async () => {
      const root = makeTempDir();
      await writeTrace(root, makeTrace({ sessionId: 's1', startedAt: '2026-04-01T00:00:00Z' }));
      await writeTrace(root, makeTrace({ sessionId: 's2', startedAt: '2026-04-02T00:00:00Z' }));
      await writeTrace(root, makeTrace({ sessionId: 's3', startedAt: '2026-04-03T00:00:00Z' }));

      const count = await countTracesSinceLastExtraction(root);
      expect(count).toBe(3);
    });

    it('returns zero for empty directory', async () => {
      const root = makeTempDir();
      const count = await countTracesSinceLastExtraction(root);
      expect(count).toBe(0);
    });
  });
});
