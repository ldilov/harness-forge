import { describe, expect, it } from 'vitest';
import { DuplicateSuppressor, type ContextSource } from '../../src/application/behavior/duplicate-suppressor.js';

describe('DuplicateSuppressor', () => {
  const suppressor = new DuplicateSuppressor();

  it('keeps all sources when content is unique', () => {
    const sources: ContextSource[] = [
      { path: 'bridge.md', type: 'bridge', content: 'bridge content' },
      { path: 'wrapper.md', type: 'wrapper', content: 'wrapper content' },
      { path: 'runtime.json', type: 'runtime', content: 'runtime content' },
    ];
    const result = suppressor.suppress(sources);
    expect(result.totalSources).toBe(3);
    expect(result.suppressedCount).toBe(0);
    expect(result.survivingSources).toHaveLength(3);
  });

  it('runtime wins over bridge when content is identical', () => {
    const shared = 'identical content here';
    const sources: ContextSource[] = [
      { path: 'bridge.md', type: 'bridge', content: shared },
      { path: 'runtime.json', type: 'runtime', content: shared },
    ];
    const result = suppressor.suppress(sources);
    expect(result.suppressedCount).toBe(1);
    expect(result.survivingSources).toHaveLength(1);
    expect(result.survivingSources[0]!.type).toBe('runtime');
    expect(result.survivingSources[0]!.path).toBe('runtime.json');
    expect(result.suppressedSources[0]!.path).toBe('bridge.md');
  });

  it('runtime wins over wrapper when content is identical', () => {
    const shared = 'duplicate stuff';
    const sources: ContextSource[] = [
      { path: 'wrapper.md', type: 'wrapper', content: shared },
      { path: 'runtime.json', type: 'runtime', content: shared },
    ];
    const result = suppressor.suppress(sources);
    expect(result.suppressedCount).toBe(1);
    expect(result.survivingSources[0]!.type).toBe('runtime');
  });

  it('first source wins when neither is runtime', () => {
    const shared = 'same content';
    const sources: ContextSource[] = [
      { path: 'bridge.md', type: 'bridge', content: shared },
      { path: 'wrapper.md', type: 'wrapper', content: shared },
    ];
    const result = suppressor.suppress(sources);
    expect(result.suppressedCount).toBe(1);
    expect(result.survivingSources[0]!.path).toBe('bridge.md');
    expect(result.suppressedSources[0]!.path).toBe('wrapper.md');
  });

  it('suppresses all duplicates across 3 sources', () => {
    const shared = 'triple duplicate';
    const sources: ContextSource[] = [
      { path: 'bridge.md', type: 'bridge', content: shared },
      { path: 'wrapper.md', type: 'wrapper', content: shared },
      { path: 'runtime.json', type: 'runtime', content: shared },
    ];
    const result = suppressor.suppress(sources);
    expect(result.totalSources).toBe(3);
    expect(result.suppressedCount).toBe(2);
    expect(result.survivingSources).toHaveLength(1);
    expect(result.survivingSources[0]!.type).toBe('runtime');
  });

  it('does not false-positive on different content', () => {
    const sources: ContextSource[] = [
      { path: 'a.md', type: 'bridge', content: 'alpha' },
      { path: 'b.md', type: 'bridge', content: 'beta' },
    ];
    const result = suppressor.suppress(sources);
    expect(result.suppressedCount).toBe(0);
    expect(result.survivingSources).toHaveLength(2);
  });

  it('provides suppression reason with source path', () => {
    const shared = 'reason test';
    const sources: ContextSource[] = [
      { path: 'bridge.md', type: 'bridge', content: shared },
      { path: 'runtime.json', type: 'runtime', content: shared },
    ];
    const result = suppressor.suppress(sources);
    expect(result.suppressedSources[0]!.reason).toContain('runtime.json');
  });
});
