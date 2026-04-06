import { describe, it, expect } from 'vitest';
import {
  LoopRetentionPolicySchema,
  DailyTraceDigestSchema,
  RetentionTier,
} from '@domain/loop/retention-policy.js';

describe('LoopRetentionPolicySchema contract', () => {
  it('parses with defaults when given empty object', () => {
    const result = LoopRetentionPolicySchema.parse({});
    expect(result.hotDays).toBe(30);
    expect(result.warmDays).toBe(90);
  });

  it('accepts custom values', () => {
    const result = LoopRetentionPolicySchema.parse({ hotDays: 14, warmDays: 60 });
    expect(result.hotDays).toBe(14);
    expect(result.warmDays).toBe(60);
  });

  it('rejects non-positive hotDays', () => {
    const result = LoopRetentionPolicySchema.safeParse({ hotDays: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer warmDays', () => {
    const result = LoopRetentionPolicySchema.safeParse({ warmDays: 30.5 });
    expect(result.success).toBe(false);
  });
});

describe('DailyTraceDigestSchema contract', () => {
  it('validates a correct digest', () => {
    const digest = {
      date: '2025-01-15',
      sessionCount: 5,
      avgScore: 72.5,
      totalTokensUsed: 50000,
      totalTokensSaved: 12000,
      compactionCount: 3,
      topStrategies: ['trim', 'summarize'],
      errorCount: 1,
    };
    const result = DailyTraceDigestSchema.safeParse(digest);
    expect(result.success).toBe(true);
  });

  it('rejects avgScore above 100', () => {
    const digest = {
      date: '2025-01-15',
      sessionCount: 1,
      avgScore: 101,
      totalTokensUsed: 1000,
      totalTokensSaved: 0,
      compactionCount: 0,
      topStrategies: [],
      errorCount: 0,
    };
    const result = DailyTraceDigestSchema.safeParse(digest);
    expect(result.success).toBe(false);
  });

  it('rejects negative sessionCount', () => {
    const digest = {
      date: '2025-01-15',
      sessionCount: -1,
      avgScore: 50,
      totalTokensUsed: 0,
      totalTokensSaved: 0,
      compactionCount: 0,
      topStrategies: [],
      errorCount: 0,
    };
    const result = DailyTraceDigestSchema.safeParse(digest);
    expect(result.success).toBe(false);
  });
});

describe('RetentionTier contract', () => {
  it('has exactly 3 values', () => {
    const values = RetentionTier.options;
    expect(values).toHaveLength(3);
    expect(values).toContain('hot');
    expect(values).toContain('warm');
    expect(values).toContain('cold');
  });
});
