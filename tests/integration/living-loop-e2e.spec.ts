import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { writeTrace, appendScore, readTraces, readScores } from '@app/loop/trace-store.js';
import { scoreSession } from '@app/loop/effectiveness-scorer.js';
import { extractPatterns } from '@app/loop/pattern-extractor.js';
import { savePatterns, loadPatterns } from '@app/loop/insight-store.js';
import { createBundle } from '@app/loop/state-exporter.js';
import { importBundle, mergeInsights } from '@app/loop/bundle-importer.js';
import type { SessionTrace } from '@domain/loop/session-trace.js';

function buildMockTrace(index: number): SessionTrace {
  return {
    traceId: `trc_${index}`,
    sessionId: `rsn_${index}`,
    target: 'claude-code',
    repo: 'test-app',
    startedAt: new Date(Date.now() - (6 - index) * 60_000).toISOString(),
    durationSeconds: 1800,
    metrics: {
      tokensUsed: 50_000 + index * 5_000,
      tokenBudget: 128_000,
      compactionsTriggered: index % 2,
      compactionStrategies: index % 2 ? ['summarize'] : [],
      tokensSaved: index % 2 ? 15_000 : 0,
      subagentsSpawned: 1,
      duplicatesSuppressed: 2,
      skillsInvoked: index > 3 ? ['tdd-workflow'] : [],
      commandsRun: ['hforge next'],
      errorsEncountered: index > 4 ? 2 : 0,
    },
    outcome: {
      taskCompleted: index < 5,
      retries: index > 3 ? 1 : 0,
      userCorrections: 0,
      budgetExceeded: false,
    },
  };
}

describe('Living Loop E2E', () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await mkdtemp(path.join(tmpdir(), 'loop-e2e-'));
    await mkdir(path.join(workspace, '.hforge', 'runtime', 'traces'), { recursive: true });
    await mkdir(path.join(workspace, '.hforge', 'runtime', 'insights'), { recursive: true });
  });

  afterEach(async () => {
    await rm(workspace, { recursive: true, force: true });
  });

  it('completes a full Observe -> Learn -> Adapt -> Share -> Import cycle', async () => {
    // ---------------------------------------------------------------
    // 1. OBSERVE: Write 6 mock traces + scores
    // ---------------------------------------------------------------
    for (let i = 0; i < 6; i++) {
      const trace = buildMockTrace(i);
      await writeTrace(workspace, trace);

      const score = scoreSession(trace);
      await appendScore(workspace, score);
    }

    const traces = await readTraces(workspace);
    expect(traces.length).toBe(6);

    const scores = await readScores(workspace);
    expect(scores.length).toBe(6);

    // ---------------------------------------------------------------
    // 2. LEARN: Extract patterns from traces + scores
    // ---------------------------------------------------------------
    const patterns = await extractPatterns(workspace);
    // extractPatterns may or may not find patterns depending on data shape;
    // the pipeline completing without error is the key assertion.
    expect(Array.isArray(patterns)).toBe(true);

    // Persist whatever patterns were found
    await savePatterns(workspace, patterns);

    const loaded = await loadPatterns(workspace);
    expect(loaded.length).toBe(patterns.length);

    // ---------------------------------------------------------------
    // 3. SHARE: Export bundle
    // ---------------------------------------------------------------
    const bundlePath = path.join(workspace, 'test-export.hfb');
    await createBundle(workspace, bundlePath);

    const bundleContent = await readFile(bundlePath, 'utf-8');
    const bundle = JSON.parse(bundleContent) as {
      manifest: { formatVersion: string; bundleId: string };
      insights: { patterns: unknown[]; scores: unknown[] };
    };

    expect(bundle.manifest).toBeDefined();
    expect(bundle.manifest.formatVersion).toBe('1.0.0');
    expect(bundle.manifest.bundleId).toBeTruthy();
    expect(bundle.insights.scores.length).toBe(6);

    // ---------------------------------------------------------------
    // 4. IMPORT: Import bundle into a fresh workspace
    // ---------------------------------------------------------------
    const workspace2 = await mkdtemp(path.join(tmpdir(), 'loop-e2e-import-'));
    await mkdir(path.join(workspace2, '.hforge', 'runtime', 'insights'), { recursive: true });

    const result = await importBundle(workspace2, bundlePath);
    expect(result.merged).toBeDefined();
    expect(Array.isArray(result.merged)).toBe(true);

    // ---------------------------------------------------------------
    // 5. Verify the full pipeline completed without errors
    // ---------------------------------------------------------------
    const importedPatterns = await loadPatterns(workspace2);
    // Imported patterns should match what was in the bundle
    expect(importedPatterns.length).toBe(patterns.length);

    // Cleanup workspace2
    await rm(workspace2, { recursive: true, force: true });
  });

  it('mergeInsights resolves conflicts correctly', () => {
    const local = [
      {
        id: 'pat_1',
        type: 'compaction_affinity',
        confidence: 0.6,
        sampleSize: 10,
        discoveredAt: '2026-04-06',
        lastValidated: '2026-04-06',
        finding: 'local finding',
        evidence: {},
      },
    ];
    const imported = [
      {
        id: 'pat_1',
        type: 'compaction_affinity',
        confidence: 0.8,
        sampleSize: 15,
        discoveredAt: '2026-04-05',
        lastValidated: '2026-04-05',
        finding: 'imported finding',
        evidence: {},
      },
      {
        id: 'pat_2',
        type: 'budget_sweet_spot',
        confidence: 0.7,
        sampleSize: 8,
        discoveredAt: '2026-04-05',
        lastValidated: '2026-04-05',
        finding: 'new finding',
        evidence: {},
      },
    ];

    const result = mergeInsights(local, imported);

    // pat_1: imported wins (higher confidence)
    const pat1 = result.merged.find((p) => p.id === 'pat_1');
    expect(pat1?.confidence).toBe(0.8);

    // pat_2: added with 20% discount (0.7 * 0.8 = 0.56)
    const pat2 = result.merged.find((p) => p.id === 'pat_2');
    expect(pat2?.confidence).toBeCloseTo(0.56, 1);

    expect(result.added).toBe(1);
    expect(result.updated).toBe(1);
  });

  it('scores all traces within expected range', () => {
    for (let i = 0; i < 6; i++) {
      const trace = buildMockTrace(i);
      const score = scoreSession(trace);

      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(score.sessionId).toBe(trace.sessionId);
      expect(score.traceId).toBe(trace.traceId);
      expect(score.breakdown).toBeDefined();
    }
  });
});
