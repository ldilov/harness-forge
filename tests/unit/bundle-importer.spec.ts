import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  mergeInsights,
  importBundle,
  type InsightPattern,
  type BundleData,
} from "../../src/application/loop/bundle-importer.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePattern(overrides: Partial<InsightPattern> & { id: string }): InsightPattern {
  return {
    type: "perf",
    confidence: 0.8,
    sampleSize: 10,
    discoveredAt: "2025-01-01T00:00:00Z",
    lastValidated: "2025-01-01T00:00:00Z",
    finding: "test finding",
    evidence: {},
    ...overrides,
  };
}

function makeBundle(
  patterns: readonly InsightPattern[],
  policies: Record<string, unknown> = {},
): BundleData {
  return {
    manifest: {
      bundleId: "test-bundle-1",
      formatVersion: "1.0.0",
      createdAt: "2025-01-01T00:00:00Z",
      exportProfile: "runtime-standard",
    },
    insights: {
      patterns,
      scores: [],
    },
    policies,
  };
}

async function writeBundleFile(dir: string, bundle: BundleData): Promise<string> {
  const fp = path.join(dir, "test-bundle.hfb");
  await fs.writeFile(fp, JSON.stringify(bundle, null, 2), "utf-8");
  return fp;
}

// ---------------------------------------------------------------------------
// mergeInsights — pure function tests
// ---------------------------------------------------------------------------

describe("mergeInsights", () => {
  it("returns all imported patterns discounted by 20% when no overlap", () => {
    const local: InsightPattern[] = [];
    const imported = [
      makePattern({ id: "p1", confidence: 1.0 }),
      makePattern({ id: "p2", confidence: 0.5 }),
    ];

    const result = mergeInsights(local, imported);

    expect(result.added).toBe(2);
    expect(result.updated).toBe(0);
    expect(result.merged).toHaveLength(2);
    expect(result.merged[0]!.confidence).toBeCloseTo(0.8); // 1.0 * 0.8
    expect(result.merged[1]!.confidence).toBeCloseTo(0.4); // 0.5 * 0.8
    expect(result.conflicts.every((c) => c.resolution === "added_new")).toBe(true);
  });

  it("uses imported pattern when it has higher confidence", () => {
    const local = [makePattern({ id: "p1", confidence: 0.6 })];
    const imported = [makePattern({ id: "p1", confidence: 0.9 })];

    const result = mergeInsights(local, imported);

    expect(result.updated).toBe(1);
    expect(result.added).toBe(0);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0]!.confidence).toBe(0.9);
    expect(result.conflicts[0]!.resolution).toBe("used_imported");
  });

  it("keeps local pattern when it has higher confidence", () => {
    const local = [makePattern({ id: "p1", confidence: 0.9 })];
    const imported = [makePattern({ id: "p1", confidence: 0.6 })];

    const result = mergeInsights(local, imported);

    expect(result.updated).toBe(0);
    expect(result.added).toBe(0);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0]!.confidence).toBe(0.9);
    expect(result.conflicts[0]!.resolution).toBe("kept_local");
  });

  it("uses imported when equal confidence but larger sampleSize", () => {
    const local = [makePattern({ id: "p1", confidence: 0.7, sampleSize: 5 })];
    const imported = [makePattern({ id: "p1", confidence: 0.7, sampleSize: 20 })];

    const result = mergeInsights(local, imported);

    expect(result.updated).toBe(1);
    expect(result.merged[0]!.sampleSize).toBe(20);
    expect(result.conflicts[0]!.resolution).toBe("used_imported");
  });

  it("keeps local when equal confidence and equal sampleSize", () => {
    const local = [makePattern({ id: "p1", confidence: 0.7, sampleSize: 10 })];
    const imported = [makePattern({ id: "p1", confidence: 0.7, sampleSize: 10 })];

    const result = mergeInsights(local, imported);

    expect(result.updated).toBe(0);
    expect(result.conflicts[0]!.resolution).toBe("kept_local");
  });
});

// ---------------------------------------------------------------------------
// importBundle — I/O tests
// ---------------------------------------------------------------------------

describe("importBundle", () => {
  let tmpDir: string;
  let workspaceRoot: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-import-"));
    workspaceRoot = tmpDir;
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("reads bundle file and saves merged patterns", async () => {
    const patterns = [makePattern({ id: "p1", confidence: 0.9 })];
    const bundle = makeBundle(patterns);
    const bundlePath = await writeBundleFile(tmpDir, bundle);

    const result = await importBundle(workspaceRoot, bundlePath);

    expect(result.added).toBe(1);
    expect(result.merged).toHaveLength(1);

    // Verify patterns were persisted
    const patternsFile = path.join(workspaceRoot, ".hforge/runtime/insights/patterns.json");
    const saved = JSON.parse(await fs.readFile(patternsFile, "utf-8")) as InsightPattern[];
    expect(saved).toHaveLength(1);
    expect(saved[0]!.id).toBe("p1");
  });

  it("does not write anything when dryRun is true", async () => {
    const patterns = [makePattern({ id: "p1", confidence: 0.9 })];
    const bundle = makeBundle(patterns);
    const bundlePath = await writeBundleFile(tmpDir, bundle);

    const result = await importBundle(workspaceRoot, bundlePath, { dryRun: true });

    expect(result.added).toBe(1);

    // Verify no files were created
    const insightsDir = path.join(workspaceRoot, ".hforge/runtime/insights");
    await expect(fs.access(insightsDir)).rejects.toThrow();
  });

  it("skips policies when insightsOnly is true", async () => {
    const patterns = [makePattern({ id: "p1", confidence: 0.9 })];
    const bundle = makeBundle(patterns, { retention: "30d", autoApply: true });
    const bundlePath = await writeBundleFile(tmpDir, bundle);

    await importBundle(workspaceRoot, bundlePath, { insightsOnly: true });

    const policiesPath = path.join(workspaceRoot, ".hforge/runtime/insights/imported-policies.json");
    await expect(fs.access(policiesPath)).rejects.toThrow();
  });

  it("saves policies when insightsOnly is not set", async () => {
    const policies = { retention: "30d", autoApply: true };
    const patterns = [makePattern({ id: "p1", confidence: 0.9 })];
    const bundle = makeBundle(patterns, policies);
    const bundlePath = await writeBundleFile(tmpDir, bundle);

    await importBundle(workspaceRoot, bundlePath);

    const policiesPath = path.join(workspaceRoot, ".hforge/runtime/insights/imported-policies.json");
    const saved = JSON.parse(await fs.readFile(policiesPath, "utf-8")) as Record<string, unknown>;
    expect(saved).toEqual(policies);
  });

  it("logs merge event to merge-log.ndjson", async () => {
    const patterns = [makePattern({ id: "p1", confidence: 0.9 })];
    const bundle = makeBundle(patterns);
    const bundlePath = await writeBundleFile(tmpDir, bundle);

    await importBundle(workspaceRoot, bundlePath);

    const logPath = path.join(workspaceRoot, ".hforge/runtime/insights/merge-log.ndjson");
    const content = await fs.readFile(logPath, "utf-8");
    const lines = content.trim().split("\n");
    expect(lines).toHaveLength(1);

    const event = JSON.parse(lines[0]!) as Record<string, unknown>;
    expect(event.event).toBe("bundle-imported");
    expect(event.bundleId).toBe("test-bundle-1");
    expect(event.added).toBe(1);
  });

  it("throws on unsupported format version", async () => {
    const bundle: BundleData = {
      manifest: {
        bundleId: "bad-version",
        formatVersion: "2.0.0",
        createdAt: "2025-01-01T00:00:00Z",
        exportProfile: "runtime-standard",
      },
      insights: { patterns: [], scores: [] },
      policies: {},
    };
    const bundlePath = await writeBundleFile(tmpDir, bundle);

    await expect(importBundle(workspaceRoot, bundlePath)).rejects.toThrow(
      /Unsupported bundle format version/,
    );
  });
});
