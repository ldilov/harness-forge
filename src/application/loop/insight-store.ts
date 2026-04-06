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
}
