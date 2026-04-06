import path from "node:path";

import { readJsonFile, writeJsonFile, exists } from "../../shared/fs.js";
import {
  RUNTIME_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_PATTERNS_FILE,
  RUNTIME_MERGE_LOG_FILE,
} from "../../shared/constants.js";
import { appendNdjson } from "../../infrastructure/events/ndjson-writer.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

export interface BundleData {
  readonly manifest: {
    readonly bundleId: string;
    readonly formatVersion: string;
    readonly createdAt: string;
    readonly exportProfile: string;
  };
  readonly insights: {
    readonly patterns: readonly InsightPattern[];
    readonly scores: readonly unknown[];
  };
  readonly policies: Record<string, unknown>;
}

export interface MergeConflict {
  readonly patternId: string;
  readonly localConfidence: number;
  readonly importedConfidence: number;
  readonly resolution: "kept_local" | "used_imported" | "added_new";
}

export interface MergeResult {
  readonly merged: readonly InsightPattern[];
  readonly added: number;
  readonly updated: number;
  readonly conflicts: readonly MergeConflict[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_FORMAT_VERSION = "1.0";
const NEW_PATTERN_DISCOUNT = 0.8;

// ---------------------------------------------------------------------------
// Pure merge logic
// ---------------------------------------------------------------------------

export function mergeInsights(
  local: readonly InsightPattern[],
  imported: readonly InsightPattern[],
): MergeResult {
  const localMap = new Map<string, InsightPattern>(
    local.map((p) => [p.id, p]),
  );

  const conflicts: MergeConflict[] = [];
  const mergedMap = new Map<string, InsightPattern>(
    local.map((p) => [p.id, p]),
  );

  let added = 0;
  let updated = 0;

  for (const imp of imported) {
    const existing = localMap.get(imp.id);

    if (!existing) {
      // New pattern — discount confidence by 20%
      const discounted: InsightPattern = {
        ...imp,
        confidence: imp.confidence * NEW_PATTERN_DISCOUNT,
      };
      mergedMap.set(imp.id, discounted);
      added += 1;
      conflicts.push({
        patternId: imp.id,
        localConfidence: 0,
        importedConfidence: imp.confidence,
        resolution: "added_new",
      });
      continue;
    }

    // Existing pattern — higher confidence wins; tie-break by sampleSize
    if (
      imp.confidence > existing.confidence ||
      (imp.confidence === existing.confidence && imp.sampleSize > existing.sampleSize)
    ) {
      mergedMap.set(imp.id, imp);
      updated += 1;
      conflicts.push({
        patternId: imp.id,
        localConfidence: existing.confidence,
        importedConfidence: imp.confidence,
        resolution: "used_imported",
      });
    } else {
      conflicts.push({
        patternId: imp.id,
        localConfidence: existing.confidence,
        importedConfidence: imp.confidence,
        resolution: "kept_local",
      });
    }
  }

  return {
    merged: [...mergedMap.values()],
    added,
    updated,
    conflicts,
  };
}

// ---------------------------------------------------------------------------
// I/O helpers
// ---------------------------------------------------------------------------

function insightsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INSIGHTS_DIR);
}

function patternsPath(workspaceRoot: string): string {
  return path.join(insightsDir(workspaceRoot), RUNTIME_PATTERNS_FILE);
}

function mergeLogPath(workspaceRoot: string): string {
  return path.join(insightsDir(workspaceRoot), RUNTIME_MERGE_LOG_FILE);
}

async function loadLocalPatterns(workspaceRoot: string): Promise<readonly InsightPattern[]> {
  const fp = patternsPath(workspaceRoot);
  if (await exists(fp)) {
    return readJsonFile<InsightPattern[]>(fp);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface ImportBundleOptions {
  readonly insightsOnly?: boolean;
  readonly dryRun?: boolean;
}

export async function importBundle(
  workspaceRoot: string,
  bundlePath: string,
  options?: ImportBundleOptions,
): Promise<MergeResult> {
  const bundle = await readJsonFile<BundleData>(bundlePath);

  // Validate format version
  if (!bundle.manifest?.formatVersion?.startsWith(SUPPORTED_FORMAT_VERSION)) {
    throw new Error(
      `Unsupported bundle format version: ${bundle.manifest?.formatVersion ?? "unknown"}. Expected ${SUPPORTED_FORMAT_VERSION}.x`,
    );
  }

  const localPatterns = await loadLocalPatterns(workspaceRoot);
  const result = mergeInsights(localPatterns, [...bundle.insights.patterns]);

  if (options?.dryRun) {
    return result;
  }

  // Persist merged patterns
  await writeJsonFile(patternsPath(workspaceRoot), result.merged);

  // Apply policies unless insights-only
  if (!options?.insightsOnly && Object.keys(bundle.policies).length > 0) {
    const policiesPath = path.join(insightsDir(workspaceRoot), "imported-policies.json");
    await writeJsonFile(policiesPath, bundle.policies);
  }

  // Log merge event
  await appendNdjson(mergeLogPath(workspaceRoot), {
    event: "bundle-imported",
    bundleId: bundle.manifest.bundleId,
    timestamp: new Date().toISOString(),
    added: result.added,
    updated: result.updated,
    conflictCount: result.conflicts.length,
  });

  return result;
}

export async function previewImport(
  workspaceRoot: string,
  bundlePath: string,
): Promise<MergeResult> {
  return importBundle(workspaceRoot, bundlePath, { dryRun: true });
}
