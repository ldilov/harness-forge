import { z } from 'zod';

export const RepoFingerprintSchema = z.object({
  languageMix: z.record(z.number()).default({}),
  fileCount: z.number().int().nonnegative(),
  frameworkHints: z.array(z.string()).default([]),
  avgSessionScore: z.number().min(0).max(100).optional(),
});
export type RepoFingerprint = z.infer<typeof RepoFingerprintSchema>;

export const BundleManifestSchema = z.object({
  bundleId: z.string(),
  formatVersion: z.literal('1.0.0'),
  createdAt: z.string(),
  sourceRepoFingerprint: RepoFingerprintSchema,
  exportProfile: z.enum(['full', 'insights-only']).default('full'),
  contents: z.array(z.string()).default([]),
});
export type BundleManifest = z.infer<typeof BundleManifestSchema>;
