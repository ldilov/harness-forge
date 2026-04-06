import { describe, expect, it, beforeEach } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createBundle, createRepoFingerprint, exportInsightsOnly } from '@app/loop/state-exporter.js';
import { BundleManifestSchema } from '@domain/loop/bundle-manifest.js';
import {
  RUNTIME_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_PATTERNS_FILE,
  BUNDLE_FILE_EXTENSION,
  RUNTIME_CONTEXT_BUDGET_FILE,
  RUNTIME_MEMORY_POLICY_FILE,
  RUNTIME_LOAD_ORDER_FILE,
  RUNTIME_SCAN_SUMMARY_FILE,
  RUNTIME_REPO_MAP_FILE,
} from '@shared/constants.js';

async function makeTempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), 'hforge-exporter-'));
}

async function seedWorkspace(root: string): Promise<void> {
  const insightsDir = path.join(root, RUNTIME_DIR, RUNTIME_INSIGHTS_DIR);
  const runtimeDir = path.join(root, RUNTIME_DIR);
  await fs.mkdir(insightsDir, { recursive: true });

  const patterns = [
    {
      id: 'pat_001',
      type: 'budget_sweet_spot',
      confidence: 0.8,
      sampleSize: 10,
      discoveredAt: '2026-04-01T00:00:00Z',
      lastValidated: '2026-04-05T00:00:00Z',
      finding: 'Budget 150k works best',
      evidence: {},
    },
  ];
  await fs.writeFile(
    path.join(insightsDir, RUNTIME_PATTERNS_FILE),
    JSON.stringify(patterns),
  );

  const ledgerLines = [
    JSON.stringify({
      sessionId: 'ses_1',
      traceId: 'trc_1',
      score: 82,
      breakdown: {
        tokenEfficiency: 90,
        taskCompletion: 100,
        compactionHealth: 70,
        errorRate: 80,
        userFriction: 60,
      },
      scoredAt: '2026-04-05T10:00:00Z',
      repo: 'test-repo',
      target: 'claude',
    }),
  ];
  await fs.writeFile(
    path.join(insightsDir, 'effectiveness-ledger.ndjson'),
    ledgerLines.join('\n') + '\n',
  );

  await fs.writeFile(
    path.join(runtimeDir, RUNTIME_CONTEXT_BUDGET_FILE),
    JSON.stringify({ hardCap: 200000 }),
  );
  await fs.writeFile(
    path.join(runtimeDir, RUNTIME_MEMORY_POLICY_FILE),
    JSON.stringify({ rotationEnabled: true }),
  );
  await fs.writeFile(
    path.join(runtimeDir, RUNTIME_LOAD_ORDER_FILE),
    JSON.stringify({ order: ['rules', 'skills'] }),
  );

  await fs.writeFile(
    path.join(runtimeDir, RUNTIME_SCAN_SUMMARY_FILE),
    JSON.stringify({
      languages: { typescript: 0.8, json: 0.2 },
      totalFiles: 250,
    }),
  );
  await fs.writeFile(
    path.join(runtimeDir, RUNTIME_REPO_MAP_FILE),
    JSON.stringify({ files: new Array(250).fill('file.ts') }),
  );
}

describe('state-exporter', () => {
  let workspaceRoot: string;

  beforeEach(async () => {
    workspaceRoot = await makeTempDir();
    await seedWorkspace(workspaceRoot);
  });

  describe('createBundle', () => {
    it('writes a file with .hfb extension', async () => {
      const outputDir = await makeTempDir();
      const outputPath = path.join(outputDir, `export${BUNDLE_FILE_EXTENSION}`);
      const result = await createBundle(workspaceRoot, outputPath);

      expect(result).toBe(outputPath);
      const stat = await fs.stat(outputPath);
      expect(stat.isFile()).toBe(true);
    });

    it('includes patterns and scores in bundle', async () => {
      const outputDir = await makeTempDir();
      const outputPath = path.join(outputDir, `export${BUNDLE_FILE_EXTENSION}`);
      await createBundle(workspaceRoot, outputPath);

      const raw = await fs.readFile(outputPath, 'utf-8');
      const data = JSON.parse(raw);
      expect(data.insights.patterns).toHaveLength(1);
      expect(data.insights.patterns[0].id).toBe('pat_001');
      expect(data.insights.scores).toHaveLength(1);
      expect(data.insights.scores[0].score).toBe(82);
    });

    it('produces valid JSON', async () => {
      const outputDir = await makeTempDir();
      const outputPath = path.join(outputDir, `export${BUNDLE_FILE_EXTENSION}`);
      await createBundle(workspaceRoot, outputPath);

      const raw = await fs.readFile(outputPath, 'utf-8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });

    it('manifest has correct formatVersion', async () => {
      const outputDir = await makeTempDir();
      const outputPath = path.join(outputDir, `export${BUNDLE_FILE_EXTENSION}`);
      await createBundle(workspaceRoot, outputPath);

      const raw = await fs.readFile(outputPath, 'utf-8');
      const data = JSON.parse(raw);
      expect(data.manifest.formatVersion).toBe('1.0.0');
      expect(() => BundleManifestSchema.parse(data.manifest)).not.toThrow();
    });

    it('includes policy files in full mode', async () => {
      const outputDir = await makeTempDir();
      const outputPath = path.join(outputDir, `export${BUNDLE_FILE_EXTENSION}`);
      await createBundle(workspaceRoot, outputPath);

      const raw = await fs.readFile(outputPath, 'utf-8');
      const data = JSON.parse(raw);
      expect(data.policies).toBeDefined();
      expect(data.policies['context-budget.json']).toEqual({ hardCap: 200000 });
    });
  });

  describe('exportInsightsOnly', () => {
    it('excludes policies from insights-only export', async () => {
      const outputDir = await makeTempDir();
      const outputPath = path.join(outputDir, `insights${BUNDLE_FILE_EXTENSION}`);
      await exportInsightsOnly(workspaceRoot, outputPath);

      const raw = await fs.readFile(outputPath, 'utf-8');
      const data = JSON.parse(raw);
      expect(data.manifest.exportProfile).toBe('insights-only');
      expect(data.policies).toEqual({});
    });
  });

  describe('createRepoFingerprint', () => {
    it('returns a valid fingerprint from scan-summary data', async () => {
      const fp = await createRepoFingerprint(workspaceRoot);
      expect(fp.fileCount).toBe(250);
      expect(fp.languageMix).toEqual({ typescript: 0.8, json: 0.2 });
    });

    it('returns defaults when no scan data exists', async () => {
      const emptyRoot = await makeTempDir();
      const fp = await createRepoFingerprint(emptyRoot);
      expect(fp.fileCount).toBe(0);
      expect(fp.languageMix).toEqual({});
      expect(fp.frameworkHints).toEqual([]);
    });
  });
});
