import { describe, it, expect } from 'vitest';

import { generateId } from '../../src/shared/id-generator.js';

describe('generateId', () => {
  it('returns an id with the correct prefix for each type', () => {
    expect(generateId('event')).toMatch(/^evt_/);
    expect(generateId('session')).toMatch(/^rsn_/);
    expect(generateId('task')).toMatch(/^task_/);
    expect(generateId('compaction')).toMatch(/^cmp_/);
    expect(generateId('correlation')).toMatch(/^corr_/);
  });

  it('generates unique ids across multiple calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('event')));
    expect(ids.size).toBe(50);
  });

  it('produces the correct format: prefix + 24 hex characters', () => {
    const id = generateId('run');
    const suffix = id.replace(/^run_/, '');
    expect(suffix).toMatch(/^[0-9a-f]{24}$/);
  });
});
