import { describe, it, expect } from 'vitest';

import { evaluateShapeTriggers } from '../../src/application/compaction/triggers/shape-trigger.js';

describe('evaluateShapeTriggers', () => {
  it('triggers on high duplicate retrieval count', () => {
    const result = evaluateShapeTriggers({ duplicateRetrievalCount: 10 });
    expect(result.shouldTrigger).toBe(true);
    expect(result.reasons[0]).toContain('duplicateRetrievalCount');
  });

  it('triggers on high repeated restatement count', () => {
    const result = evaluateShapeTriggers({ repeatedRestatementCount: 5 });
    expect(result.shouldTrigger).toBe(true);
    expect(result.reasons[0]).toContain('repeatedRestatementCount');
  });

  it('triggers on excessive low importance events', () => {
    const result = evaluateShapeTriggers({ lowImportanceEventCount: 60 });
    expect(result.shouldTrigger).toBe(true);
    expect(result.reasons[0]).toContain('lowImportanceEventCount');
  });

  it('does not trigger when all metrics are below thresholds', () => {
    const result = evaluateShapeTriggers({
      duplicateRetrievalCount: 2,
      repeatedRestatementCount: 1,
      lowImportanceEventCount: 10,
      recursiveDepth: 2,
      narrativeOutputRatio: 0.3,
    });
    expect(result.shouldTrigger).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it('triggers on high narrative output ratio', () => {
    const result = evaluateShapeTriggers({ narrativeOutputRatio: 0.8 });
    expect(result.shouldTrigger).toBe(true);
    expect(result.reasons[0]).toContain('narrativeOutputRatio');
  });
});
