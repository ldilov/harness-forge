import { describe, expect, it } from 'vitest';

import { z } from 'zod';
import { SubagentBriefGenerator } from '@app/behavior/subagent-brief-generator.js';
import { type SubagentBriefPolicy } from '@domain/behavior/subagent-brief-policy.js';
import { BriefDecisionSchema } from '@domain/behavior/subagent-brief.js';

type BriefDecision = z.infer<typeof BriefDecisionSchema>;

function makePolicy(
  overrides: Partial<SubagentBriefPolicy> = {},
): SubagentBriefPolicy {
  return {
    schemaVersion: '1.0.0',
    allow: [
      'objective',
      'scope',
      'relevantDecisions',
      'constraints',
      'latestDelta',
      'references',
      'responseProfile',
      'budget',
    ],
    denyByDefault: [
      'fullMemory',
      'fullSessionSummary',
      'fullEventHistory',
      'unrelatedArtifacts',
    ],
    defaultResponseProfile: 'brief',
    ...overrides,
  };
}

function makeDecision(
  id: string,
  title: string,
  rationale = 'test rationale',
): BriefDecision {
  return { id, title, rationale };
}

describe('SubagentBriefGenerator', () => {
  const generator = new SubagentBriefGenerator();

  it('filters decisions by keyword overlap with objective', () => {
    const decisions = [
      makeDecision('d1', 'authentication token strategy'),
      makeDecision('d2', 'database migration plan'),
      makeDecision('d3', 'authentication provider selection'),
    ];

    const brief = generator.generate({
      taskObjective: 'Implement authentication module',
      taskScope: 'src/auth',
      allDecisions: decisions,
      allConstraints: [],
      latestDelta: [],
      allReferences: [],
      policy: makePolicy(),
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
    });

    expect(brief.relevantDecisions).toHaveLength(2);
    expect(brief.relevantDecisions.map((d) => d.id)).toEqual(['d1', 'd3']);
  });

  it('excludes forbidden fields from decisions', () => {
    const decisions = [
      makeDecision('d1', 'valid decision'),
      makeDecision('fullMemory', 'fullMemory'),
      makeDecision('d3', 'fullSessionSummary'),
    ];

    const brief = generator.generate({
      taskObjective: 'valid decision about fullMemory and fullSessionSummary',
      taskScope: 'src/',
      allDecisions: decisions,
      allConstraints: [],
      latestDelta: [],
      allReferences: [],
      policy: makePolicy(),
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
    });

    const ids = brief.relevantDecisions.map((d) => d.id);
    expect(ids).toContain('d1');
    expect(ids).not.toContain('fullMemory');
  });

  it('attaches budget correctly', () => {
    const brief = generator.generate({
      taskObjective: 'any task',
      taskScope: 'src/',
      allDecisions: [],
      allConstraints: [],
      latestDelta: [],
      allReferences: [],
      policy: makePolicy(),
      maxInputTokens: 8000,
      maxOutputTokens: 3000,
    });

    expect(brief.budget.maxInputTokens).toBe(8000);
    expect(brief.budget.maxOutputTokens).toBe(3000);
  });

  it('defaults response profile to brief', () => {
    const brief = generator.generate({
      taskObjective: 'any task',
      taskScope: 'src/',
      allDecisions: [],
      allConstraints: [],
      latestDelta: [],
      allReferences: [],
      policy: makePolicy(),
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
    });

    expect(brief.responseProfile).toBe('brief');
  });

  it('uses policy defaultResponseProfile when set to standard', () => {
    const brief = generator.generate({
      taskObjective: 'any task',
      taskScope: 'src/',
      allDecisions: [],
      allConstraints: [],
      latestDelta: [],
      allReferences: [],
      policy: makePolicy({ defaultResponseProfile: 'standard' }),
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
    });

    expect(brief.responseProfile).toBe('standard');
  });

  it('estimates tokens as a positive integer', () => {
    const brief = generator.generate({
      taskObjective: 'some task',
      taskScope: 'src/',
      allDecisions: [makeDecision('d1', 'some decision')],
      allConstraints: ['constraint one'],
      latestDelta: ['delta one'],
      allReferences: ['ref one'],
      policy: makePolicy(),
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
    });

    expect(brief.estimatedTokens).toBeGreaterThan(0);
    expect(Number.isInteger(brief.estimatedTokens)).toBe(true);
  });

  it('generates a brief with briefId and generatedAt', () => {
    const brief = generator.generate({
      taskObjective: 'any task',
      taskScope: 'src/',
      allDecisions: [],
      allConstraints: [],
      latestDelta: [],
      allReferences: [],
      policy: makePolicy(),
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
    });

    expect(brief.briefId).toMatch(/^brf_/);
    expect(brief.generatedAt).toBeTruthy();
  });

  it('filters constraints by keyword overlap', () => {
    const brief = generator.generate({
      taskObjective: 'Implement caching layer',
      taskScope: 'src/cache',
      allDecisions: [],
      allConstraints: [
        'No external caching services',
        'Must use PostgreSQL only',
        'Caching invalidation within 5 seconds',
      ],
      latestDelta: [],
      allReferences: [],
      policy: makePolicy(),
      maxInputTokens: 4000,
      maxOutputTokens: 2000,
    });

    expect(brief.constraints).toHaveLength(2);
    expect(brief.constraints).toContain('No external caching services');
    expect(brief.constraints).toContain('Caching invalidation within 5 seconds');
  });
});
