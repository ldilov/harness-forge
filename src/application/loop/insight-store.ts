<<<<<<< HEAD
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
=======
import fs from "node:fs/promises";
import path from "node:path";
import { readJsonFile, exists } from "../../shared/index.js";
import type { ExtractedPattern } from "./pattern-extractor.js";

const INSIGHTS_FILE = ".hforge/runtime/insights.json";

/** Persist extracted patterns to the workspace insight store. */
export async function savePatterns(
  workspaceRoot: string,
  patterns: readonly ExtractedPattern[],
): Promise<void> {
  const filePath = path.join(workspaceRoot, INSIGHTS_FILE);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(patterns, null, 2), "utf8");
}

/** Load all previously saved patterns. */
export async function loadPatterns(workspaceRoot: string): Promise<readonly ExtractedPattern[]> {
  const filePath = path.join(workspaceRoot, INSIGHTS_FILE);
  if (!(await exists(filePath))) {
    return [];
  }
  return readJsonFile<ExtractedPattern[]>(filePath);
}

/** Return all patterns as recommendations (alias kept for semantic clarity). */
export async function getRecommendations(workspaceRoot: string): Promise<readonly ExtractedPattern[]> {
  return loadPatterns(workspaceRoot);
}

/** Return only patterns with confidence >= 0.7. */
export async function getActionableInsights(workspaceRoot: string): Promise<readonly ExtractedPattern[]> {
  const all = await loadPatterns(workspaceRoot);
  return all.filter((p) => p.confidence >= 0.7);
}

/** Heuristic: should we run extraction? True when no insights exist yet. */
export async function shouldExtract(workspaceRoot: string): Promise<boolean> {
  const patterns = await loadPatterns(workspaceRoot);
  return patterns.length === 0;
>>>>>>> worktree-agent-a8f973be
}
