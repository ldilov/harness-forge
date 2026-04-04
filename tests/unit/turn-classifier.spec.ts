import { describe, it, expect } from 'vitest';

import { classifyItem } from '../../src/application/compaction/turn-classifier.js';

describe('classifyItem', () => {
  it('assigns correct redundancy score for duplicate items', () => {
    const result = classifyItem({ id: '1', type: 'event', importance: 'low', duplicateOf: '2' });
    expect(result.redundancyScore).toBe(0.8);
  });

  it('assigns zero redundancy for non-duplicate items', () => {
    const result = classifyItem({ id: '1', type: 'event', importance: 'high' });
    expect(result.redundancyScore).toBe(0.0);
  });

  it('maps high importance to artifact-backed recoverability', () => {
    const result = classifyItem({ id: '1', type: 'event', importance: 'high' });
    expect(result.recoverability).toBe('artifact-backed');
  });

  it('maps critical importance to must-preserve recoverability', () => {
    const result = classifyItem({ id: '1', type: 'event', importance: 'critical' });
    expect(result.recoverability).toBe('must-preserve');
  });

  it('defaults unknown importance to medium', () => {
    const result = classifyItem({ id: '1', type: 'event', importance: 'unknown' });
    expect(result.importance).toBe('medium');
    expect(result.recoverability).toBe('recoverable');
  });

  it('computes recency from occurredAt timestamp', () => {
    const recent = new Date().toISOString();
    const result = classifyItem({ id: '1', type: 'event', importance: 'high', occurredAt: recent });
    expect(result.recency).toBeDefined();
    expect(result.recency!).toBeGreaterThan(0.9);
  });

  it('assigns targetRelevance when targetName provided', () => {
    const result = classifyItem({ id: '1', type: 'event', importance: 'high', targetName: 'claude-code' });
    expect(result.targetRelevance).toBe(1.0);
  });

  it('leaves recency and targetRelevance undefined when not provided', () => {
    const result = classifyItem({ id: '1', type: 'event', importance: 'high' });
    expect(result.recency).toBeUndefined();
    expect(result.targetRelevance).toBeUndefined();
  });
});
