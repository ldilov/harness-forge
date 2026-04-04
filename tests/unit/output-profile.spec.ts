import { describe, it, expect } from 'vitest';

import { getDefaultProfile } from '../../src/application/compaction/output-profile.js';

describe('getDefaultProfile', () => {
  it('returns brief for recursive-worker', () => {
    expect(getDefaultProfile('recursive-worker')).toBe('brief');
  });

  it('returns brief for subagent', () => {
    expect(getDefaultProfile('subagent')).toBe('brief');
  });

  it('returns standard for operator', () => {
    expect(getDefaultProfile('operator')).toBe('standard');
  });

  it('returns deep for audit', () => {
    expect(getDefaultProfile('audit')).toBe('deep');
  });

  it('falls back to standard for unknown actor types', () => {
    expect(getDefaultProfile('unknown-actor')).toBe('standard');
  });
});
