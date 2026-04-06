import { describe, it, expect } from 'vitest';
import {
  InsightPatternSchema,
  PatternType,
  PatternRecommendationSchema,
  type InsightPattern,
  type PatternRecommendation,
} from '@domain/loop/insight-pattern.js';

const validRecommendation: PatternRecommendation = {
  action: 'increase_budget',
  params: { amount: 5000 },
  impact: 'Reduces compaction frequency by ~30%',
};

const validPattern: InsightPattern = {
  id: 'pat-001',
  type: 'budget_sweet_spot',
  confidence: 0.85,
  sampleSize: 42,
  discoveredAt: '2026-04-06T10:00:00Z',
  lastValidated: '2026-04-06T12:00:00Z',
  finding: 'Sessions with 8k token budget hit fewer compactions',
  evidence: { avgCompactions: 1.2, sampleSessions: 42 },
  recommendation: validRecommendation,
};

describe('InsightPattern contract', () => {
  it('parses valid pattern with all fields', () => {
    const result = InsightPatternSchema.parse(validPattern);
    expect(result).toEqual(validPattern);
  });

  it('PatternType has exactly 6 enum values', () => {
    const values = PatternType.options;
    expect(values).toHaveLength(6);
    expect(values).toEqual([
      'compaction_affinity',
      'budget_sweet_spot',
      'skill_effectiveness',
      'failure_mode',
      'time_pattern',
      'pack_gap',
    ]);
  });

  it('confidence must be 0-1 — rejects 1.5', () => {
    expect(() =>
      InsightPatternSchema.parse({ ...validPattern, confidence: 1.5 }),
    ).toThrow();
  });

  it('confidence must be 0-1 — rejects -0.1', () => {
    expect(() =>
      InsightPatternSchema.parse({ ...validPattern, confidence: -0.1 }),
    ).toThrow();
  });

  it('evidence defaults to empty object', () => {
    const { evidence: _, ...withoutEvidence } = validPattern;
    const result = InsightPatternSchema.parse(withoutEvidence);
    expect(result.evidence).toEqual({});
  });

  it('recommendation is optional', () => {
    const { recommendation: _, ...withoutRec } = validPattern;
    const result = InsightPatternSchema.parse(withoutRec);
    expect(result.recommendation).toBeUndefined();
  });

  it('rejects missing required fields', () => {
    const { id: _, ...missingId } = validPattern;
    expect(() => InsightPatternSchema.parse(missingId)).toThrow();

    const { type: __, ...missingType } = validPattern;
    expect(() => InsightPatternSchema.parse(missingType)).toThrow();

    const { finding: ___, ...missingFinding } = validPattern;
    expect(() => InsightPatternSchema.parse(missingFinding)).toThrow();
  });

  it('parses valid recommendation', () => {
    const result = PatternRecommendationSchema.parse(validRecommendation);
    expect(result).toEqual(validRecommendation);
  });

  it('recommendation params defaults to empty object', () => {
    const { params: _, ...withoutParams } = validRecommendation;
    const result = PatternRecommendationSchema.parse(withoutParams);
    expect(result.params).toEqual({});
  });
});
