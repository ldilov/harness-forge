import { describe, it, expect } from 'vitest';
import { scoreSession } from '@app/loop/effectiveness-scorer.js';
import type { SessionTrace } from '@domain/loop/session-trace.js';
import { SCORE_WEIGHTS } from '@domain/loop/effectiveness-score.js';

const baseTrace: SessionTrace = {
  sessionId: 'test-session-1',
  tokensUsed: 5000,
  tokenBudget: 20000,
  completed: true,
  retries: 0,
  userCorrections: 0,
  budgetExceeded: false,
  compactionsTriggered: 0,
  tokensSaved: 0,
  subagentsSpawned: 1,
  commandsRun: ['git status', 'npm test'],
  errorsEncountered: 0,
};

describe('scoreSession', () => {
  it('healthy session scores above 70', () => {
    const result = scoreSession(baseTrace);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.sessionId).toBe('test-session-1');
  });

  it('high token usage penalizes score', () => {
    const heavy: SessionTrace = {
      ...baseTrace,
      tokensUsed: 19000,
      tokenBudget: 20000,
    };
    const result = scoreSession(heavy);
    expect(result.breakdown.tokenEfficiency).toBeLessThan(20);
    expect(result.score).toBeLessThan(scoreSession(baseTrace).score);
  });

  it('incomplete task penalizes score', () => {
    const incomplete: SessionTrace = {
      ...baseTrace,
      completed: false,
    };
    const result = scoreSession(incomplete);
    expect(result.breakdown.taskCompletion).toBe(0);
    expect(result.score).toBeLessThan(scoreSession(baseTrace).score);
  });

  it('retries penalize score', () => {
    const retried: SessionTrace = {
      ...baseTrace,
      retries: 3,
    };
    const result = scoreSession(retried);
    expect(result.breakdown.taskCompletion).toBe(55);
  });

  it('user corrections penalize score', () => {
    const corrected: SessionTrace = {
      ...baseTrace,
      userCorrections: 2,
    };
    const result = scoreSession(corrected);
    expect(result.breakdown.userFriction).toBe(50);
    expect(result.breakdown.taskCompletion).toBe(60);
  });

  it('budget exceeded zeroes compaction health', () => {
    const exceeded: SessionTrace = {
      ...baseTrace,
      budgetExceeded: true,
    };
    const result = scoreSession(exceeded);
    expect(result.breakdown.compactionHealth).toBe(0);
  });

  it('all breakdown values are 0-100', () => {
    const extreme: SessionTrace = {
      ...baseTrace,
      tokensUsed: 100000,
      tokenBudget: 1000,
      retries: 20,
      userCorrections: 10,
      errorsEncountered: 50,
    };
    const result = scoreSession(extreme);
    const values = Object.values(result.breakdown);
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('weighted score matches manual calculation', () => {
    const result = scoreSession(baseTrace);
    const { breakdown } = result;
    const manual = Math.round(
      breakdown.tokenEfficiency * SCORE_WEIGHTS.tokenEfficiency +
      breakdown.taskCompletion * SCORE_WEIGHTS.taskCompletion +
      breakdown.compactionHealth * SCORE_WEIGHTS.compactionHealth +
      breakdown.errorRate * SCORE_WEIGHTS.errorRate +
      breakdown.userFriction * SCORE_WEIGHTS.userFriction,
    );
    expect(result.score).toBe(manual);
  });

  it('zero-action edge case does not divide by zero', () => {
    const zeroAction: SessionTrace = {
      ...baseTrace,
      compactionsTriggered: 0,
      subagentsSpawned: 0,
      commandsRun: [],
      errorsEncountered: 0,
    };
    const result = scoreSession(zeroAction);
    expect(Number.isFinite(result.score)).toBe(true);
    expect(result.breakdown.errorRate).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.errorRate).toBeLessThanOrEqual(100);
  });

  it('perfect session scores 100', () => {
    const perfect: SessionTrace = {
      ...baseTrace,
      tokensUsed: 0,
      tokenBudget: 20000,
      completed: true,
      retries: 0,
      userCorrections: 0,
      budgetExceeded: false,
      compactionsTriggered: 0,
      tokensSaved: 0,
      subagentsSpawned: 0,
      commandsRun: [],
      errorsEncountered: 0,
    };
    const result = scoreSession(perfect);
    expect(result.score).toBe(100);
  });
});
