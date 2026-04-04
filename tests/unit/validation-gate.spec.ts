import { describe, it, expect } from 'vitest';

import { validateCompaction } from '../../src/application/compaction/validation-gate.js';

describe('validateCompaction', () => {
  const fullContext = {
    objective: 'Implement feature X',
    acceptedPlan: ['step 1', 'step 2'],
    unresolved: [],
    artifacts: ['src/index.ts'],
    criticalEventsPreserved: true,
  };

  it('passes when all fields are present and criticalEventsPreserved is true', () => {
    const result = validateCompaction(fullContext);
    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('fails when objective is missing', () => {
    const result = validateCompaction({ ...fullContext, objective: undefined });
    expect(result.passed).toBe(false);
    expect(result.failures).toContain('objective missing or empty');
  });

  it('fails when acceptedPlan is missing', () => {
    const result = validateCompaction({ ...fullContext, acceptedPlan: undefined });
    expect(result.passed).toBe(false);
    expect(result.failures).toContain('acceptedPlan missing');
  });

  it('fails when criticalEventsPreserved is false', () => {
    const result = validateCompaction({ ...fullContext, criticalEventsPreserved: false });
    expect(result.passed).toBe(false);
    expect(result.failures).toContain('critical events not preserved');
  });
});
