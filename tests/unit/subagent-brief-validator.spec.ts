import { describe, expect, it } from 'vitest';

import { SubagentBriefValidator } from '@app/behavior/subagent-brief-validator.js';
import { type SubagentBriefPolicy } from '@domain/behavior/subagent-brief-policy.js';
import { type SubagentBrief } from '@domain/behavior/subagent-brief.js';

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

describe('SubagentBriefValidator', () => {
  const validator = new SubagentBriefValidator();

  it('passes for a compliant brief', () => {
    const result = validator.validate(makeBrief(), makePolicy());
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('fails when estimated tokens exceed budget maxInputTokens', () => {
    const brief = makeBrief({
      estimatedTokens: 5000,
      budget: { maxInputTokens: 4000, maxOutputTokens: 2000 },
    });

    const result = validator.validate(brief, makePolicy());
    expect(result.valid).toBe(false);
    expect(result.violations.some((v) => v.includes('exceed'))).toBe(true);
  });

  it('fails when a content field is not in the allow list', () => {
    const policy = makePolicy({
      allow: ['objective', 'scope'],
    });

    const result = validator.validate(makeBrief(), policy);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.includes('not in the policy allow list')),
    ).toBe(true);
  });

  it('fails when a content field appears in denyByDefault', () => {
    const policy = makePolicy({
      denyByDefault: [
        'fullMemory',
        'fullSessionSummary',
        'fullEventHistory',
        'unrelatedArtifacts',
        'objective',
      ],
    });

    const result = validator.validate(makeBrief(), policy);
    expect(result.valid).toBe(false);
    expect(
      result.violations.some((v) => v.includes('denyByDefault')),
    ).toBe(true);
  });

  it('reports multiple violations at once', () => {
    const policy = makePolicy({
      allow: ['objective'],
      denyByDefault: ['scope'],
    });
    const brief = makeBrief({ estimatedTokens: 9999 });

    const result = validator.validate(brief, policy);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(3);
  });
});
