import { describe, expect, it } from 'vitest';
import { OutputProfileResolver } from '../../src/application/behavior/output-profile-resolver.js';

describe('OutputProfileResolver', () => {
  const resolver = new OutputProfileResolver();

  it('defaults to standard for top_level context', () => {
    const result = resolver.resolve('top_level');
    expect(result.profile).toBe('standard');
    expect(result.source).toBe('default');
  });

  it('defaults to brief for subagent context', () => {
    const result = resolver.resolve('subagent');
    expect(result.profile).toBe('brief');
    expect(result.source).toBe('default');
  });

  it('defaults to brief for recursive_worker context', () => {
    const result = resolver.resolve('recursive_worker');
    expect(result.profile).toBe('brief');
  });

  it('defaults to deep for review_export context', () => {
    const result = resolver.resolve('review_export');
    expect(result.profile).toBe('deep');
  });

  it('uses explicit override when provided', () => {
    const result = resolver.resolve('subagent', 'deep');
    expect(result.profile).toBe('deep');
    expect(result.source).toBe('explicit_override');
  });

  it('override works for any context', () => {
    const result = resolver.resolve('top_level', 'brief');
    expect(result.profile).toBe('brief');
    expect(result.source).toBe('explicit_override');
    expect(result.context).toBe('top_level');
  });
});
