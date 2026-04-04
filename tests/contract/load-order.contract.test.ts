import { describe, expect, it } from 'vitest';
import { LoadOrderSchema } from '../../src/domain/behavior/load-order.js';

describe('load-order contract', () => {
  it('parses with all defaults', () => {
    const result = LoadOrderSchema.parse({});
    expect(result.schemaVersion).toBe('1.0.0');
    expect(result.conflictPolicy).toBe('runtime_wins');
    expect(result.historyPolicy).toBe('deny_by_default');
    expect(result.resumeOrder.length).toBeGreaterThanOrEqual(2);
    expect(result.resumeOrder).toContain('memory.md');
  });

  it('accepts runtime_wins conflict policy', () => {
    const result = LoadOrderSchema.parse({ conflictPolicy: 'runtime_wins' });
    expect(result.conflictPolicy).toBe('runtime_wins');
  });

  it('accepts memory_wins conflict policy', () => {
    const result = LoadOrderSchema.parse({ conflictPolicy: 'memory_wins' });
    expect(result.conflictPolicy).toBe('memory_wins');
  });

  it('rejects invalid conflict policy', () => {
    expect(() => LoadOrderSchema.parse({ conflictPolicy: 'invalid' })).toThrow();
  });

  it('accepts deny_by_default history policy', () => {
    const result = LoadOrderSchema.parse({ historyPolicy: 'deny_by_default' });
    expect(result.historyPolicy).toBe('deny_by_default');
  });

  it('rejects invalid history policy', () => {
    expect(() => LoadOrderSchema.parse({ historyPolicy: 'invalid' })).toThrow();
  });
});
