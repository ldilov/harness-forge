import { describe, expect, it } from 'vitest';
import {
  SessionTraceSchema,
  TraceMetricsSchema,
  TraceOutcomeSchema,
} from '@domain/loop/index.js';

const validMetrics = {
  tokensUsed: 50000,
  tokenBudget: 200000,
  compactionsTriggered: 2,
  compactionStrategies: ['summarize', 'trim'],
  tokensSaved: 15000,
  subagentsSpawned: 1,
  duplicatesSuppressed: 3,
  skillsInvoked: ['tdd-guide', 'code-reviewer'],
  commandsRun: ['npx vitest run', 'npx tsc --noEmit'],
  errorsEncountered: 0,
};

const validOutcome = {
  taskCompleted: true,
  retries: 1,
  userCorrections: 0,
  budgetExceeded: false,
};

const validTrace = {
  traceId: 'trace-abc-123',
  sessionId: 'session-xyz-789',
  target: 'harness-forge',
  repo: 'user/harness-forge',
  startedAt: '2026-04-06T10:00:00Z',
  endedAt: '2026-04-06T10:15:00Z',
  durationSeconds: 900,
  metrics: validMetrics,
  outcome: validOutcome,
};

describe('TraceMetrics contract', () => {
  it('parses valid metrics', () => {
    const result = TraceMetricsSchema.safeParse(validMetrics);
    expect(result.success).toBe(true);
  });

  it('defaults compactionStrategies to empty array', () => {
    const { compactionStrategies, ...rest } = validMetrics;
    const result = TraceMetricsSchema.parse(rest);
    expect(result.compactionStrategies).toEqual([]);
  });

  it('defaults skillsInvoked to empty array', () => {
    const { skillsInvoked, ...rest } = validMetrics;
    const result = TraceMetricsSchema.parse(rest);
    expect(result.skillsInvoked).toEqual([]);
  });

  it('defaults commandsRun to empty array', () => {
    const { commandsRun, ...rest } = validMetrics;
    const result = TraceMetricsSchema.parse(rest);
    expect(result.commandsRun).toEqual([]);
  });

  it('rejects negative tokensUsed', () => {
    const result = TraceMetricsSchema.safeParse({ ...validMetrics, tokensUsed: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects zero tokenBudget', () => {
    const result = TraceMetricsSchema.safeParse({ ...validMetrics, tokenBudget: 0 });
    expect(result.success).toBe(false);
  });

  it('rejects negative errorsEncountered', () => {
    const result = TraceMetricsSchema.safeParse({ ...validMetrics, errorsEncountered: -5 });
    expect(result.success).toBe(false);
  });
});

describe('TraceOutcome contract', () => {
  it('parses valid outcome', () => {
    const result = TraceOutcomeSchema.safeParse(validOutcome);
    expect(result.success).toBe(true);
  });

  it('rejects negative retries', () => {
    const result = TraceOutcomeSchema.safeParse({ ...validOutcome, retries: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative userCorrections', () => {
    const result = TraceOutcomeSchema.safeParse({ ...validOutcome, userCorrections: -1 });
    expect(result.success).toBe(false);
  });
});

describe('SessionTrace contract', () => {
  it('parses a valid full session trace', () => {
    const result = SessionTraceSchema.safeParse(validTrace);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.traceId).toBe('trace-abc-123');
      expect(result.data.metrics.tokensUsed).toBe(50000);
      expect(result.data.outcome.taskCompleted).toBe(true);
    }
  });

  it('rejects trace with missing required fields', () => {
    const { traceId, ...incomplete } = validTrace;
    const result = SessionTraceSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('rejects trace with missing sessionId', () => {
    const { sessionId, ...incomplete } = validTrace;
    const result = SessionTraceSchema.safeParse(incomplete);
    expect(result.success).toBe(false);
  });

  it('accepts minimal trace without endedAt', () => {
    const { endedAt, ...minimal } = validTrace;
    const result = SessionTraceSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.endedAt).toBeUndefined();
    }
  });

  it('rejects negative durationSeconds', () => {
    const result = SessionTraceSchema.safeParse({ ...validTrace, durationSeconds: -10 });
    expect(result.success).toBe(false);
  });

  it('defaults optional arrays in nested metrics', () => {
    const metricsWithoutArrays = {
      tokensUsed: 1000,
      tokenBudget: 200000,
      compactionsTriggered: 0,
      tokensSaved: 0,
      subagentsSpawned: 0,
      duplicatesSuppressed: 0,
      errorsEncountered: 0,
    };
    const trace = { ...validTrace, metrics: metricsWithoutArrays };
    const result = SessionTraceSchema.parse(trace);
    expect(result.metrics.compactionStrategies).toEqual([]);
    expect(result.metrics.skillsInvoked).toEqual([]);
    expect(result.metrics.commandsRun).toEqual([]);
  });
});
