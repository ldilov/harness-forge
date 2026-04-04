import { describe, expect, it } from 'vitest';

import {
  SubagentBriefSchema,
  BriefBudgetSchema,
} from '../../src/domain/behavior/subagent-brief.js';

describe('SubagentBrief contract', () => {
  const validBrief = {
    briefId: 'brf_abc123',
    generatedAt: '2026-01-01T00:00:00.000Z',
    objective: 'Implement auth module',
    scope: 'src/auth',
    relevantDecisions: [
      { id: 'dec_1', title: 'Use JWT tokens', rationale: 'Industry standard' },
    ],
    constraints: ['No external auth providers'],
    latestDelta: ['Added login endpoint'],
    references: ['docs/auth.md'],
    responseProfile: 'brief' as const,
    budget: {
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
    },
    estimatedTokens: 500,
    sourceStateType: 'compacted' as const,
  };

  it('parses a valid brief', () => {
    const result = SubagentBriefSchema.safeParse(validBrief);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.briefId).toBe('brf_abc123');
      expect(result.data.relevantDecisions).toHaveLength(1);
    }
  });

  it('requires budget fields', () => {
    const noBudget = { ...validBrief, budget: undefined };
    const result = SubagentBriefSchema.safeParse(noBudget);
    expect(result.success).toBe(false);
  });

  it('requires maxInputTokens in budget', () => {
    const result = BriefBudgetSchema.safeParse({ maxOutputTokens: 2000 });
    expect(result.success).toBe(false);
  });

  it('requires maxOutputTokens in budget', () => {
    const result = BriefBudgetSchema.safeParse({ maxInputTokens: 4000 });
    expect(result.success).toBe(false);
  });

  it('constrains responseProfile to enum values', () => {
    const invalidProfile = { ...validBrief, responseProfile: 'verbose' };
    const result = SubagentBriefSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it('accepts all valid responseProfile values', () => {
    for (const profile of ['brief', 'standard', 'deep'] as const) {
      const withProfile = { ...validBrief, responseProfile: profile };
      const result = SubagentBriefSchema.safeParse(withProfile);
      expect(result.success).toBe(true);
    }
  });

  it('defaults optional arrays when omitted', () => {
    const minimal = {
      briefId: 'brf_min',
      generatedAt: '2026-01-01T00:00:00.000Z',
      objective: 'Task',
      scope: 'src/',
      budget: { maxInputTokens: 1000, maxOutputTokens: 500 },
      estimatedTokens: 100,
    };
    const result = SubagentBriefSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relevantDecisions).toEqual([]);
      expect(result.data.constraints).toEqual([]);
      expect(result.data.latestDelta).toEqual([]);
      expect(result.data.references).toEqual([]);
      expect(result.data.responseProfile).toBe('brief');
    }
  });
});
