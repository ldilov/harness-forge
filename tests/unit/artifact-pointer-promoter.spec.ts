import { describe, expect, it } from 'vitest';
import { ArtifactPointerPromoter } from '../../src/application/behavior/artifact-pointer-promoter.js';

describe('ArtifactPointerPromoter', () => {
  it('does not promote content below threshold', () => {
    const promoter = new ArtifactPointerPromoter(2000);
    const result = promoter.evaluate({
      id: 'short-1',
      content: 'Short content here.',
    });
    expect(result.promoted).toBe(false);
    expect(result.estimatedTokensSaved).toBe(0);
  });

  it('promotes content exceeding threshold', () => {
    const promoter = new ArtifactPointerPromoter(100);
    const longContent = 'x'.repeat(500);
    const result = promoter.evaluate({
      id: 'long-1',
      content: longContent,
      sourcePath: '.hforge/runtime/findings/report.json',
    });
    expect(result.promoted).toBe(true);
    expect(result.reference).toContain('.hforge/runtime/findings/report.json');
    expect(result.estimatedTokensSaved).toBeGreaterThan(0);
  });

  it('uses artifact id when sourcePath is absent', () => {
    const promoter = new ArtifactPointerPromoter(50);
    const result = promoter.evaluate({
      id: 'art-42',
      content: 'a'.repeat(200),
    });
    expect(result.promoted).toBe(true);
    expect(result.reference).toContain('art-42');
  });

  it('evaluateAll processes multiple items', () => {
    const promoter = new ArtifactPointerPromoter(100);
    const results = promoter.evaluateAll([
      { id: '1', content: 'short' },
      { id: '2', content: 'y'.repeat(500), sourcePath: 'big.json' },
    ]);
    expect(results).toHaveLength(2);
    expect(results[0]!.promoted).toBe(false);
    expect(results[1]!.promoted).toBe(true);
  });

  it('handles content exactly at threshold', () => {
    const promoter = new ArtifactPointerPromoter(10);
    const result = promoter.evaluate({ id: 'edge', content: '1234567890' });
    expect(result.promoted).toBe(false);
  });
});
