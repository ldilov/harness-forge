import { describe, expect, it } from 'vitest';

import { SubagentBriefRewriter } from '@app/behavior/subagent-brief-rewriter.js';
import { type SubagentBrief } from '@domain/behavior/subagent-brief.js';

function makeBrief(overrides: Partial<SubagentBrief> = {}): SubagentBrief {
  return {
    briefId: 'brf_test',
    generatedAt: '2026-01-01T00:00:00.000Z',
    objective: 'Test objective',
    scope: 'src/test',
    relevantDecisions: [],
    constraints: [],
    latestDelta: [],
    references: [],
    responseProfile: 'brief',
    budget: {
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
    },
    estimatedTokens: 500,
    sourceStateType: 'compacted',
    ...overrides,
  };
}

function makeLargeDecisions(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `dec_${i}`,
    title: `Decision ${i} with substantial content to increase token count significantly`,
    rationale: `Rationale ${i} with enough detail to matter for token estimation purposes`,
  }));
}

describe('SubagentBriefRewriter', () => {
  const rewriter = new SubagentBriefRewriter();

  it('truncates least-relevant decisions first (last in array)', () => {
    const decisions = makeLargeDecisions(5);
    const brief = makeBrief({
      relevantDecisions: decisions,
      estimatedTokens: 2000,
    });

    // Set a tight budget that forces truncation
    const tokenBudget = Math.ceil(JSON.stringify(makeBrief({ relevantDecisions: decisions.slice(0, 2) })).length / 4);

    const result = rewriter.rewrite(brief, tokenBudget);
    expect('rejected' in result && result.rejected).not.toBe(true);

    if ('rewritten' in result) {
      expect(result.truncatedDecisions).toBeGreaterThan(0);
      // Should keep the first decisions (most relevant) and drop from the end
      expect(result.rewritten.relevantDecisions.length).toBeLessThan(
        decisions.length,
      );
      if (result.rewritten.relevantDecisions.length > 0) {
        expect(result.rewritten.relevantDecisions[0]!.id).toBe('dec_0');
      }
    }
  });

  it('returns rewritten brief without truncation when under budget', () => {
    const brief = makeBrief();
    const result = rewriter.rewrite(brief, 10000);

    expect('rejected' in result && result.rejected).not.toBe(true);
    if ('rewritten' in result) {
      expect(result.truncatedDecisions).toBe(0);
      expect(result.rewritten.objective).toBe(brief.objective);
    }
  });

  it('rejects when brief is unrewritable', () => {
    const brief = makeBrief({
      objective: 'A'.repeat(400),
      scope: 'B'.repeat(400),
    });

    // Impossibly low budget
    const result = rewriter.rewrite(brief, 10);
    expect('rejected' in result && result.rejected).toBe(true);
    if ('rejected' in result && result.rejected) {
      expect(result.reason).toContain('exceeds');
    }
  });

  it('removes optional arrays before rejecting', () => {
    const brief = makeBrief({
      references: ['ref1', 'ref2', 'ref3'],
      latestDelta: ['delta1', 'delta2'],
      constraints: ['constraint1'],
    });

    // Budget that is tight but enough without optional content
    const minimalBrief = makeBrief({
      references: [],
      latestDelta: [],
      constraints: [],
    });
    const minimalTokens = Math.ceil(JSON.stringify(minimalBrief).length / 4);

    const result = rewriter.rewrite(brief, minimalTokens);
    expect('rejected' in result && result.rejected).not.toBe(true);
    if ('rewritten' in result) {
      expect(result.rewritten.references).toHaveLength(0);
      expect(result.rewritten.latestDelta).toHaveLength(0);
      expect(result.rewritten.constraints).toHaveLength(0);
    }
  });

  it('updates estimatedTokens after rewrite', () => {
    const decisions = makeLargeDecisions(10);
    const brief = makeBrief({
      relevantDecisions: decisions,
      estimatedTokens: 9999,
    });

    const result = rewriter.rewrite(brief, 500);
    if ('rewritten' in result) {
      expect(result.rewritten.estimatedTokens).toBeLessThanOrEqual(500);
      expect(result.rewritten.estimatedTokens).toBeGreaterThan(0);
    }
  });
});
