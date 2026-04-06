import { describe, it, expect, vi, afterEach } from 'vitest';

import type { SessionTrace } from '../../src/domain/loop/session-trace.js';
import type { EffectivenessScore } from '../../src/domain/loop/effectiveness-score.js';
import {
  extractCompactionAffinity,
  extractBudgetSweetSpot,
  extractSkillEffectiveness,
  extractFailureModes,
  extractPackGaps,
} from '../../src/application/loop/pattern-extractor.js';

function mockTrace(overrides: Partial<SessionTrace> = {}): SessionTrace {
  return {
    traceId: 'trc_default',
    sessionId: 'sess-default',
    target: 'default-target',
    repo: 'test-repo',
    startedAt: '2026-04-06T10:00:00Z',
    endedAt: '2026-04-06T10:05:00Z',
    durationSeconds: 300,
    metrics: {
      tokensUsed: 5000,
      tokenBudget: 10000,
      compactionsTriggered: 0,
      compactionStrategies: [],
      tokensSaved: 0,
      subagentsSpawned: 0,
      duplicatesSuppressed: 0,
      skillsInvoked: [],
      commandsRun: [],
      errorsEncountered: 0,
    },
    outcome: {
      taskCompleted: true,
      retries: 0,
      userCorrections: 0,
      budgetExceeded: false,
    },
    ...overrides,
  };
}

function mockScore(overrides: Partial<EffectivenessScore> = {}): EffectivenessScore {
  return {
    sessionId: 'sess-default',
    traceId: 'trc_default',
    score: 75,
    breakdown: {
      tokenEfficiency: 80,
      taskCompletion: 90,
      compactionHealth: 70,
      errorRate: 60,
      userFriction: 50,
    },
    scoredAt: '2026-04-06T10:06:00Z',
    repo: 'test-repo',
    target: 'default-target',
    ...overrides,
  };
}

describe('extractCompactionAffinity', () => {
  it('returns pattern when one strategy clearly beats another', () => {
    const traces = [
      mockTrace({ sessionId: 's1', traceId: 't1', metrics: { ...mockTrace().metrics, compactionStrategies: ['summarize'] } }),
      mockTrace({ sessionId: 's2', traceId: 't2', metrics: { ...mockTrace().metrics, compactionStrategies: ['summarize'] } }),
      mockTrace({ sessionId: 's3', traceId: 't3', metrics: { ...mockTrace().metrics, compactionStrategies: ['summarize'] } }),
      mockTrace({ sessionId: 's4', traceId: 't4', metrics: { ...mockTrace().metrics, compactionStrategies: ['trim'] } }),
      mockTrace({ sessionId: 's5', traceId: 't5', metrics: { ...mockTrace().metrics, compactionStrategies: ['trim'] } }),
      mockTrace({ sessionId: 's6', traceId: 't6', metrics: { ...mockTrace().metrics, compactionStrategies: ['trim'] } }),
    ];

    const scores = [
      mockScore({ sessionId: 's1', traceId: 't1', score: 85 }),
      mockScore({ sessionId: 's2', traceId: 't2', score: 90 }),
      mockScore({ sessionId: 's3', traceId: 't3', score: 88 }),
      mockScore({ sessionId: 's4', traceId: 't4', score: 60 }),
      mockScore({ sessionId: 's5', traceId: 't5', score: 55 }),
      mockScore({ sessionId: 's6', traceId: 't6', score: 58 }),
    ];

    const result = extractCompactionAffinity(scores, traces);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('compaction_affinity');
    expect(result!.sampleSize).toBe(6);
    expect(result!.finding).toContain('summarize');
    expect(result!.confidence).toBeGreaterThan(0);
    expect(result!.confidence).toBeLessThanOrEqual(1);
  });

  it('returns null with fewer than 3 samples per strategy', () => {
    const traces = [
      mockTrace({ sessionId: 's1', traceId: 't1', metrics: { ...mockTrace().metrics, compactionStrategies: ['summarize'] } }),
      mockTrace({ sessionId: 's2', traceId: 't2', metrics: { ...mockTrace().metrics, compactionStrategies: ['trim'] } }),
    ];

    const scores = [
      mockScore({ sessionId: 's1', traceId: 't1', score: 90 }),
      mockScore({ sessionId: 's2', traceId: 't2', score: 50 }),
    ];

    const result = extractCompactionAffinity(scores, traces);
    expect(result).toBeNull();
  });

  it('returns null for empty arrays', () => {
    expect(extractCompactionAffinity([], [])).toBeNull();
  });
});

describe('extractBudgetSweetSpot', () => {
  it('finds optimal threshold band with sufficient samples', () => {
    // All traces at ~50% usage (band 5: 0.5-0.6), high scores
    const traces = [
      mockTrace({ sessionId: 's1', traceId: 't1', metrics: { ...mockTrace().metrics, tokensUsed: 5000, tokenBudget: 10000 } }),
      mockTrace({ sessionId: 's2', traceId: 't2', metrics: { ...mockTrace().metrics, tokensUsed: 5500, tokenBudget: 10000 } }),
      mockTrace({ sessionId: 's3', traceId: 't3', metrics: { ...mockTrace().metrics, tokensUsed: 5200, tokenBudget: 10000 } }),
      // Some at ~90% usage (band 9: 0.9-1.0), lower scores
      mockTrace({ sessionId: 's4', traceId: 't4', metrics: { ...mockTrace().metrics, tokensUsed: 9000, tokenBudget: 10000 } }),
      mockTrace({ sessionId: 's5', traceId: 't5', metrics: { ...mockTrace().metrics, tokensUsed: 9500, tokenBudget: 10000 } }),
      mockTrace({ sessionId: 's6', traceId: 't6', metrics: { ...mockTrace().metrics, tokensUsed: 9200, tokenBudget: 10000 } }),
    ];

    const scores = [
      mockScore({ sessionId: 's1', traceId: 't1', score: 90 }),
      mockScore({ sessionId: 's2', traceId: 't2', score: 88 }),
      mockScore({ sessionId: 's3', traceId: 't3', score: 92 }),
      mockScore({ sessionId: 's4', traceId: 't4', score: 50 }),
      mockScore({ sessionId: 's5', traceId: 't5', score: 45 }),
      mockScore({ sessionId: 's6', traceId: 't6', score: 48 }),
    ];

    const result = extractBudgetSweetSpot(scores, traces);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('budget_sweet_spot');
    expect(result!.sampleSize).toBeGreaterThanOrEqual(3);
    expect(result!.finding).toContain('50%');
    expect(result!.confidence).toBeGreaterThan(0);
  });

  it('returns null with insufficient data', () => {
    const traces = [
      mockTrace({ sessionId: 's1', traceId: 't1', metrics: { ...mockTrace().metrics, tokensUsed: 5000, tokenBudget: 10000 } }),
    ];
    const scores = [
      mockScore({ sessionId: 's1', traceId: 't1', score: 90 }),
    ];

    const result = extractBudgetSweetSpot(scores, traces);
    expect(result).toBeNull();
  });

  it('returns null for empty arrays', () => {
    expect(extractBudgetSweetSpot([], [])).toBeNull();
  });
});

describe('extractSkillEffectiveness', () => {
  it('detects high-impact skill', () => {
    const traces = [
      // Sessions with 'code-review' skill
      mockTrace({ sessionId: 's1', traceId: 't1', metrics: { ...mockTrace().metrics, skillsInvoked: ['code-review'] } }),
      mockTrace({ sessionId: 's2', traceId: 't2', metrics: { ...mockTrace().metrics, skillsInvoked: ['code-review'] } }),
      mockTrace({ sessionId: 's3', traceId: 't3', metrics: { ...mockTrace().metrics, skillsInvoked: ['code-review'] } }),
      // Sessions without 'code-review' skill
      mockTrace({ sessionId: 's4', traceId: 't4', metrics: { ...mockTrace().metrics, skillsInvoked: [] } }),
      mockTrace({ sessionId: 's5', traceId: 't5', metrics: { ...mockTrace().metrics, skillsInvoked: [] } }),
      mockTrace({ sessionId: 's6', traceId: 't6', metrics: { ...mockTrace().metrics, skillsInvoked: [] } }),
    ];

    const scores = [
      mockScore({ sessionId: 's1', traceId: 't1', score: 90 }),
      mockScore({ sessionId: 's2', traceId: 't2', score: 88 }),
      mockScore({ sessionId: 's3', traceId: 't3', score: 92 }),
      mockScore({ sessionId: 's4', traceId: 't4', score: 55 }),
      mockScore({ sessionId: 's5', traceId: 't5', score: 50 }),
      mockScore({ sessionId: 's6', traceId: 't6', score: 52 }),
    ];

    const result = extractSkillEffectiveness(scores, traces);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('skill_effectiveness');
    expect(result!.finding).toContain('code-review');
    expect(result!.sampleSize).toBeGreaterThanOrEqual(3);
  });

  it('returns null for empty arrays', () => {
    expect(extractSkillEffectiveness([], [])).toBeNull();
  });
});

describe('extractFailureModes', () => {
  it('detects budgetExceeded pattern among low-scoring sessions', () => {
    const traces = [
      mockTrace({ sessionId: 's1', traceId: 't1', outcome: { ...mockTrace().outcome, budgetExceeded: true } }),
      mockTrace({ sessionId: 's2', traceId: 't2', outcome: { ...mockTrace().outcome, budgetExceeded: true } }),
      mockTrace({ sessionId: 's3', traceId: 't3', outcome: { ...mockTrace().outcome, budgetExceeded: true } }),
      mockTrace({ sessionId: 's4', traceId: 't4', outcome: { ...mockTrace().outcome, budgetExceeded: false } }),
    ];

    const scores = [
      mockScore({ sessionId: 's1', traceId: 't1', score: 30 }),
      mockScore({ sessionId: 's2', traceId: 't2', score: 25 }),
      mockScore({ sessionId: 's3', traceId: 't3', score: 40 }),
      mockScore({ sessionId: 's4', traceId: 't4', score: 85 }),
    ];

    const result = extractFailureModes(scores, traces);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('failure_mode');
    expect(result!.finding).toContain('budget');
    expect(result!.sampleSize).toBeGreaterThanOrEqual(3);
  });

  it('returns null when failures are unrelated to budget', () => {
    const traces = [
      mockTrace({ sessionId: 's1', traceId: 't1', outcome: { ...mockTrace().outcome, budgetExceeded: false } }),
      mockTrace({ sessionId: 's2', traceId: 't2', outcome: { ...mockTrace().outcome, budgetExceeded: false } }),
      mockTrace({ sessionId: 's3', traceId: 't3', outcome: { ...mockTrace().outcome, budgetExceeded: true } }),
    ];

    const scores = [
      mockScore({ sessionId: 's1', traceId: 't1', score: 30 }),
      mockScore({ sessionId: 's2', traceId: 't2', score: 25 }),
      mockScore({ sessionId: 's3', traceId: 't3', score: 40 }),
    ];

    const result = extractFailureModes(scores, traces);
    expect(result).toBeNull();
  });

  it('returns null for empty arrays', () => {
    expect(extractFailureModes([], [])).toBeNull();
  });
});

describe('extractPackGaps', () => {
  it('detects when many sessions have no skills used', () => {
    const traces = Array.from({ length: 6 }, (_, i) =>
      mockTrace({
        sessionId: `s${i}`,
        traceId: `t${i}`,
        metrics: { ...mockTrace().metrics, skillsInvoked: [] },
      }),
    );

    const result = extractPackGaps(traces);

    expect(result).not.toBeNull();
    expect(result!.type).toBe('pack_gap');
    expect(result!.sampleSize).toBe(6);
    expect(result!.finding).toContain('skill');
  });

  it('returns null when sessions use skills', () => {
    const traces = [
      mockTrace({ sessionId: 's1', metrics: { ...mockTrace().metrics, skillsInvoked: ['tdd'] } }),
      mockTrace({ sessionId: 's2', metrics: { ...mockTrace().metrics, skillsInvoked: ['review'] } }),
      mockTrace({ sessionId: 's3', metrics: { ...mockTrace().metrics, skillsInvoked: [] } }),
    ];

    const result = extractPackGaps(traces);
    expect(result).toBeNull();
  });

  it('returns null for empty arrays', () => {
    expect(extractPackGaps([])).toBeNull();
  });
});

describe('all extractors return null for empty arrays', () => {
  it('handles empty inputs gracefully across all extractors', () => {
    expect(extractCompactionAffinity([], [])).toBeNull();
    expect(extractBudgetSweetSpot([], [])).toBeNull();
    expect(extractSkillEffectiveness([], [])).toBeNull();
    expect(extractFailureModes([], [])).toBeNull();
    expect(extractPackGaps([])).toBeNull();
  });
});
