import path from "node:path";

import { readJsonFile, writeJsonFile, exists, ensureDir } from "../../shared/fs.js";
import { appendNdjson } from "../../infrastructure/events/ndjson-writer.js";
import {
  RUNTIME_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_PATTERNS_FILE,
  RUNTIME_INSIGHTS_CHANGELOG_FILE,
  RUNTIME_INSIGHTS_RECOMMENDATIONS_FILE,
  LOOP_CONFIDENCE_OBSERVE,
  LOOP_CONFIDENCE_SUGGEST,
  LOOP_PATTERN_EXTRACT_INTERVAL,
} from "../../shared/constants.js";

export interface InsightPattern {
  readonly id: string;
  readonly type: string;
  readonly confidence: number;
  readonly sampleSize: number;
  readonly discoveredAt: string;
  readonly lastValidated: string;
  readonly finding: string;
  readonly evidence: Record<string, unknown>;
  readonly recommendation?: {
    readonly action: string;
    readonly params: Record<string, unknown>;
    readonly impact: string;
  };
}

function insightsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INSIGHTS_DIR);
}

function patternsPath(workspaceRoot: string): string {
  return path.join(insightsDir(workspaceRoot), RUNTIME_PATTERNS_FILE);
}

function changelogPath(workspaceRoot: string): string {
  return path.join(insightsDir(workspaceRoot), RUNTIME_INSIGHTS_CHANGELOG_FILE);
}

function recommendationsPath(workspaceRoot: string): string {
  return path.join(insightsDir(workspaceRoot), RUNTIME_INSIGHTS_RECOMMENDATIONS_FILE);
}

export async function savePatterns(
  workspaceRoot: string,
  patterns: readonly InsightPattern[],
): Promise<void> {
  await ensureDir(insightsDir(workspaceRoot));

  await writeJsonFile(patternsPath(workspaceRoot), patterns);

  const recommendations = patterns.filter(
    (p) => p.confidence >= LOOP_CONFIDENCE_OBSERVE,
  );
  await writeJsonFile(recommendationsPath(workspaceRoot), recommendations);

  await appendNdjson(changelogPath(workspaceRoot), {
    extractedAt: new Date().toISOString(),
    patternCount: patterns.length,
    patternIds: patterns.map((p) => p.id),
  });
}

export async function loadPatterns(
  workspaceRoot: string,
): Promise<readonly InsightPattern[]> {
  const filePath = patternsPath(workspaceRoot);
  if (!(await exists(filePath))) {
    return [];
  }
  return readJsonFile<InsightPattern[]>(filePath);
}

export async function getRecommendations(
  workspaceRoot: string,
): Promise<readonly InsightPattern[]> {
  const patterns = await loadPatterns(workspaceRoot);
  return patterns.filter((p) => p.confidence >= LOOP_CONFIDENCE_OBSERVE);
}

export async function getActionableInsights(
  workspaceRoot: string,
): Promise<readonly InsightPattern[]> {
  const patterns = await loadPatterns(workspaceRoot);
  return patterns.filter((p) => p.confidence >= LOOP_CONFIDENCE_SUGGEST);
}

export function shouldExtract(tracesSinceLastExtraction: number): boolean {
  return tracesSinceLastExtraction >= LOOP_PATTERN_EXTRACT_INTERVAL;
}
