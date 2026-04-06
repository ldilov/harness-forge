import path from 'node:path';

import { readJsonFile, writeJsonFile, exists } from '../../shared/fs.js';
import { generateId } from '../../shared/id-generator.js';
import {
  RUNTIME_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_CONTEXT_BUDGET_FILE,
  RUNTIME_MEMORY_POLICY_FILE,
  RUNTIME_LOAD_ORDER_FILE,
  RUNTIME_SCAN_SUMMARY_FILE,
  RUNTIME_REPO_MAP_FILE,
} from '../../shared/constants.js';
import { loadPatterns } from './insight-store.js';
import { readScores } from './trace-store.js';
import type { BundleManifest, RepoFingerprint } from '../../domain/loop/bundle-manifest.js';
import type { InsightPattern } from '../../domain/loop/insight-pattern.js';
import type { EffectivenessScore } from '../../domain/loop/effectiveness-score.js';

interface BundleData {
  readonly manifest: BundleManifest;
  readonly insights: {
    readonly patterns: readonly InsightPattern[];
    readonly scores: readonly EffectivenessScore[];
  };
  readonly policies: Record<string, unknown>;
}

const POLICY_FILES = [
  RUNTIME_CONTEXT_BUDGET_FILE,
  RUNTIME_MEMORY_POLICY_FILE,
  RUNTIME_LOAD_ORDER_FILE,
] as const;

const MAX_RECENT_SCORES = 50;

async function loadPolicies(
  workspaceRoot: string,
): Promise<Record<string, unknown>> {
  const runtimeDir = path.join(workspaceRoot, RUNTIME_DIR);
  const policies: Record<string, unknown> = {};

  for (const file of POLICY_FILES) {
    const filePath = path.join(runtimeDir, file);
    if (await exists(filePath)) {
      policies[file] = await readJsonFile<unknown>(filePath);
    }
  }

  return policies;
}

export async function createRepoFingerprint(
  workspaceRoot: string,
): Promise<RepoFingerprint> {
  const runtimeDir = path.join(workspaceRoot, RUNTIME_DIR);
  const scanSummaryPath = path.join(runtimeDir, RUNTIME_SCAN_SUMMARY_FILE);
  const repoMapPath = path.join(runtimeDir, RUNTIME_REPO_MAP_FILE);

  let languageMix: Record<string, number> = {};
  let fileCount = 0;
  const frameworkHints: string[] = [];

  if (await exists(scanSummaryPath)) {
    const summary = await readJsonFile<{
      languages?: Record<string, number>;
      totalFiles?: number;
      frameworks?: string[];
    }>(scanSummaryPath);

    languageMix = summary.languages ?? {};
    fileCount = summary.totalFiles ?? 0;
    if (summary.frameworks) {
      frameworkHints.push(...summary.frameworks);
    }
  }

  if (fileCount === 0 && (await exists(repoMapPath))) {
    const repoMap = await readJsonFile<{
      files?: unknown[];
    }>(repoMapPath);
    fileCount = repoMap.files?.length ?? 0;
  }

  const scores = await readScores(workspaceRoot, { limit: MAX_RECENT_SCORES });
  let avgSessionScore: number | undefined;
  if (scores.length > 0) {
    const total = scores.reduce((sum, s) => sum + s.score, 0);
    avgSessionScore = Math.round(total / scores.length);
  }

  return {
    languageMix,
    fileCount,
    frameworkHints,
    avgSessionScore,
  };
}

export async function createBundle(
  workspaceRoot: string,
  outputPath: string,
  options?: { readonly insightsOnly?: boolean },
): Promise<string> {
  const patterns = await loadPatterns(workspaceRoot);
  const scores = await readScores(workspaceRoot, { limit: MAX_RECENT_SCORES });
  const fingerprint = await createRepoFingerprint(workspaceRoot);

  const exportProfile = options?.insightsOnly ? 'insights-only' as const : 'full' as const;

  const policies = exportProfile === 'full'
    ? await loadPolicies(workspaceRoot)
    : {};

  const contentsList: string[] = ['insights/patterns', 'insights/scores'];
  if (exportProfile === 'full') {
    contentsList.push(...Object.keys(policies).map((f) => `policies/${f}`));
  }

  const manifest: BundleManifest = {
    bundleId: generateId('bundle'),
    formatVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    sourceRepoFingerprint: fingerprint,
    exportProfile,
    contents: contentsList,
  };

  const bundleData: BundleData = {
    manifest,
    insights: {
      patterns,
      scores,
    },
    policies,
  };

  await writeJsonFile(outputPath, bundleData);
  return outputPath;
}

export async function exportInsightsOnly(
  workspaceRoot: string,
  outputPath: string,
): Promise<string> {
  return createBundle(workspaceRoot, outputPath, { insightsOnly: true });
}
