import { describe, expect, it } from 'vitest';

import { TriggerEngine } from '../../src/application/compaction/trigger-engine.js';
import type { ContextBudget } from '../../src/domain/compaction/context-budget.js';

function makeBudget(overrides: {
  estimatedInputTokens?: number;
  contextWindowTokens?: number;
} = {}): ContextBudget {
  const contextWindowTokens = overrides.contextWindowTokens ?? 200_000;
  const estimatedInputTokens = overrides.estimatedInputTokens ?? 0;
  return {
    schemaVersion: '1.0.0',
    model: {
      name: 'test-model',
      contextWindowTokens,
    },
    budgets: {
      maxHotPathInputTokens: 120_000,
      reservedOutputTokens: 12_000,
      reservedToolTokens: 8_000,
      reservedSafetyMargin: 10_000,
    },
    thresholds: {
      evaluateAt: 0.70,
      trimAt: 0.80,
      summarizeAt: 0.88,
      rollupAt: 0.93,
      rolloverAt: 0.96,
    },
    current: {
      estimatedInputTokens,
      estimatedOutputNeed: 0,
      state: 'none',
    },
  };
}

describe('TriggerEngine', () => {
  it('evaluate() returns null when below all thresholds', async () => {
    const engine = new TriggerEngine();
    // 10% usage, well below evaluateAt (70%)
    const budget = makeBudget({ estimatedInputTokens: 20_000 });
    const result = await engine.evaluate(budget, {});
    expect(result).toBeNull();
  });

  it('evaluate() returns correct level for threshold trigger', async () => {
    const engine = new TriggerEngine();
    // 90% usage, above summarizeAt (88%) but below rollupAt (93%)
    const budget = makeBudget({ estimatedInputTokens: 180_000 });
    const result = await engine.evaluate(budget, {});

    expect(result).not.toBeNull();
    expect(result!.level).toBe('summarize');
    expect(result!.reasons.length).toBeGreaterThan(0);
  });

  it('evaluate() returns null when already running (serialization)', async () => {
    const engine = new TriggerEngine();
    engine.setRunning(true);

    const budget = makeBudget({ estimatedInputTokens: 195_000 });
    const result = await engine.evaluate(budget, {});
    expect(result).toBeNull();
  });

  it('evaluate() picks highest level across trigger sources', async () => {
    const engine = new TriggerEngine();
    // 95% usage -> rollup level from threshold
    const budget = makeBudget({ estimatedInputTokens: 190_000 });
    // shape metrics that also trigger summarize
    const metrics = { duplicateRetrievalCount: 10 };
    // workflow trigger adds trim level
    const result = await engine.evaluate(budget, metrics, 'task.completed');

    expect(result).not.toBeNull();
    // rollup (3) > summarize (2) > trim (1), so rollup wins
    expect(result!.level).toBe('rollup');
    expect(result!.reasons.length).toBeGreaterThanOrEqual(2);
  });
});
