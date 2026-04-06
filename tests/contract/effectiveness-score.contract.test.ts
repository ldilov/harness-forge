import { describe, it, expect } from 'vitest';
import {
  EffectivenessScoreSchema,
  ScoreBreakdownSchema,
  SCORE_WEIGHTS,
  type EffectivenessScore,
  type ScoreBreakdown,
} from '@domain/loop/effectiveness-score.js';

const validBreakdown: ScoreBreakdown = {
  tokenEfficiency: 85,
  taskCompletion: 90,
  compactionHealth: 70,
  errorRate: 95,
  userFriction: 80,
};

const validRecord: EffectivenessScore = {
  sessionId: 'sess-001',
  traceId: 'trace-abc',
  score: 82,
  breakdown: validBreakdown,
  scoredAt: '2026-04-06T12:00:00Z',
  repo: 'harness-forge',
  target: 'claude',
};

describe('EffectivenessScore contract', () => {
  it('parses a valid score record', () => {
    const result = EffectivenessScoreSchema.parse(validRecord);
    expect(result).toEqual(validRecord);
  });

  it('SCORE_WEIGHTS sum to exactly 1.0', () => {
    const sum = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('rejects breakdown values below 0', () => {
    expect(() =>
      ScoreBreakdownSchema.parse({ ...validBreakdown, tokenEfficiency: -1 }),
    ).toThrow();
  });

  it('rejects breakdown values above 100', () => {
    expect(() =>
      ScoreBreakdownSchema.parse({ ...validBreakdown, taskCompletion: 101 }),
    ).toThrow();
  });

  it('rejects score below 0', () => {
    expect(() =>
      EffectivenessScoreSchema.parse({ ...validRecord, score: -5 }),
    ).toThrow();
  });

  it('rejects score above 100', () => {
    expect(() =>
      EffectivenessScoreSchema.parse({ ...validRecord, score: 150 }),
    ).toThrow();
  });

  it('requires all fields', () => {
    const { sessionId: _, ...missing } = validRecord;
    expect(() => EffectivenessScoreSchema.parse(missing)).toThrow();
  });
});
