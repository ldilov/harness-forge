import { describe, expect, it } from 'vitest';
import {
  BundleManifestSchema,
  RepoFingerprintSchema,
} from '@domain/loop/bundle-manifest.js';

describe('RepoFingerprint schema contract', () => {
  it('parses a valid fingerprint with all fields', () => {
    const input = {
      languageMix: { typescript: 0.7, javascript: 0.3 },
      fileCount: 42,
      frameworkHints: ['vitest', 'express'],
      avgSessionScore: 85,
    };
    const result = RepoFingerprintSchema.parse(input);
    expect(result.fileCount).toBe(42);
    expect(result.languageMix).toEqual({ typescript: 0.7, javascript: 0.3 });
    expect(result.frameworkHints).toEqual(['vitest', 'express']);
    expect(result.avgSessionScore).toBe(85);
  });

  it('applies defaults for languageMix, frameworkHints, and optional avgSessionScore', () => {
    const result = RepoFingerprintSchema.parse({ fileCount: 10 });
    expect(result.languageMix).toEqual({});
    expect(result.frameworkHints).toEqual([]);
    expect(result.avgSessionScore).toBeUndefined();
  });

  it('rejects negative fileCount', () => {
    expect(() =>
      RepoFingerprintSchema.parse({ fileCount: -1 }),
    ).toThrow();
  });

  it('rejects avgSessionScore outside 0-100 range', () => {
    expect(() =>
      RepoFingerprintSchema.parse({ fileCount: 5, avgSessionScore: 101 }),
    ).toThrow();
    expect(() =>
      RepoFingerprintSchema.parse({ fileCount: 5, avgSessionScore: -1 }),
    ).toThrow();
  });
});

describe('BundleManifest schema contract', () => {
  const validManifest = {
    bundleId: 'bnd_abc123',
    formatVersion: '1.0.0' as const,
    createdAt: '2026-04-06T12:00:00Z',
    sourceRepoFingerprint: {
      fileCount: 100,
    },
  };

  it('parses a valid bundle manifest', () => {
    const result = BundleManifestSchema.parse(validManifest);
    expect(result.bundleId).toBe('bnd_abc123');
    expect(result.formatVersion).toBe('1.0.0');
    expect(result.createdAt).toBe('2026-04-06T12:00:00Z');
    expect(result.sourceRepoFingerprint.fileCount).toBe(100);
  });

  it('formatVersion must be literal 1.0.0', () => {
    expect(() =>
      BundleManifestSchema.parse({
        ...validManifest,
        formatVersion: '2.0.0',
      }),
    ).toThrow();
  });

  it('defaults exportProfile to full', () => {
    const result = BundleManifestSchema.parse(validManifest);
    expect(result.exportProfile).toBe('full');
  });

  it('defaults contents to empty array', () => {
    const result = BundleManifestSchema.parse(validManifest);
    expect(result.contents).toEqual([]);
  });

  it('rejects invalid exportProfile values', () => {
    expect(() =>
      BundleManifestSchema.parse({
        ...validManifest,
        exportProfile: 'partial',
      }),
    ).toThrow();
  });

  it('accepts insights-only as exportProfile', () => {
    const result = BundleManifestSchema.parse({
      ...validManifest,
      exportProfile: 'insights-only',
    });
    expect(result.exportProfile).toBe('insights-only');
  });
});
