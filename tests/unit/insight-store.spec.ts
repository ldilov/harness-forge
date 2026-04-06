import { describe, it, expect, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import {
  savePatterns,
  loadPatterns,
  getRecommendations,
  getActionableInsights,
  shouldExtract,
} from "../../src/application/loop/insight-store.js";

import {
  RUNTIME_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_PATTERNS_FILE,
  RUNTIME_INSIGHTS_CHANGELOG_FILE,
  RUNTIME_INSIGHTS_RECOMMENDATIONS_FILE,
} from "../../src/shared/constants.js";

interface InsightPattern {
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

function makePattern(overrides: Partial<InsightPattern> = {}): InsightPattern {
  return {
    id: "pat-001",
    type: "test-pattern",
    confidence: 0.8,
    sampleSize: 10,
    discoveredAt: "2026-04-01T00:00:00.000Z",
    lastValidated: "2026-04-06T00:00:00.000Z",
    finding: "Tests run faster with parallel execution",
    evidence: { avgDuration: 120 },
    ...overrides,
  };
}

describe("insight-store", () => {
  const tempDirs: string[] = [];

  function makeTempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), "insight-store-"));
    tempDirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  describe("savePatterns", () => {
    it("writes patterns.json at correct path", async () => {
      const root = makeTempDir();
      const patterns = [makePattern()];

      await savePatterns(root, patterns);

      const patternsPath = join(
        root,
        RUNTIME_DIR,
        RUNTIME_INSIGHTS_DIR,
        RUNTIME_PATTERNS_FILE,
      );
      const content = JSON.parse(await readFile(patternsPath, "utf-8"));
      expect(content).toEqual(patterns);
    });

    it("appends changelog.ndjson entry", async () => {
      const root = makeTempDir();
      const patterns = [makePattern(), makePattern({ id: "pat-002" })];

      await savePatterns(root, patterns);

      const changelogPath = join(
        root,
        RUNTIME_DIR,
        RUNTIME_INSIGHTS_DIR,
        RUNTIME_INSIGHTS_CHANGELOG_FILE,
      );
      const raw = await readFile(changelogPath, "utf-8");
      const lines = raw.trim().split("\n").map((l) => JSON.parse(l));
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatchObject({
        patternCount: 2,
        patternIds: ["pat-001", "pat-002"],
      });
      expect(lines[0]).toHaveProperty("extractedAt");
    });

    it("writes recommendations.json filtered by confidence >= 0.5", async () => {
      const root = makeTempDir();
      const patterns = [
        makePattern({ id: "low", confidence: 0.3 }),
        makePattern({ id: "mid", confidence: 0.5 }),
        makePattern({ id: "high", confidence: 0.9 }),
      ];

      await savePatterns(root, patterns);

      const recsPath = join(
        root,
        RUNTIME_DIR,
        RUNTIME_INSIGHTS_DIR,
        RUNTIME_INSIGHTS_RECOMMENDATIONS_FILE,
      );
      const recs = JSON.parse(await readFile(recsPath, "utf-8"));
      expect(recs).toHaveLength(2);
      expect(recs.map((r: InsightPattern) => r.id)).toEqual(["mid", "high"]);
    });
  });

  describe("loadPatterns", () => {
    it("returns saved patterns", async () => {
      const root = makeTempDir();
      const patterns = [makePattern(), makePattern({ id: "pat-002" })];
      await savePatterns(root, patterns);

      const loaded = await loadPatterns(root);

      expect(loaded).toEqual(patterns);
    });

    it("returns empty array when file does not exist", async () => {
      const root = makeTempDir();

      const loaded = await loadPatterns(root);

      expect(loaded).toEqual([]);
    });
  });

  describe("getRecommendations", () => {
    it("filters by confidence >= 0.5", async () => {
      const root = makeTempDir();
      await savePatterns(root, [
        makePattern({ id: "low", confidence: 0.4 }),
        makePattern({ id: "exact", confidence: 0.5 }),
        makePattern({ id: "high", confidence: 0.8 }),
      ]);

      const recs = await getRecommendations(root);

      expect(recs.map((r) => r.id)).toEqual(["exact", "high"]);
    });
  });

  describe("getActionableInsights", () => {
    it("filters by confidence >= 0.7", async () => {
      const root = makeTempDir();
      await savePatterns(root, [
        makePattern({ id: "low", confidence: 0.6 }),
        makePattern({ id: "exact", confidence: 0.7 }),
        makePattern({ id: "high", confidence: 0.95 }),
      ]);

      const actionable = await getActionableInsights(root);

      expect(actionable.map((r) => r.id)).toEqual(["exact", "high"]);
    });
  });

  describe("shouldExtract", () => {
    it("returns true when count >= 5", () => {
      expect(shouldExtract(5)).toBe(true);
      expect(shouldExtract(10)).toBe(true);
    });

    it("returns false when count < 5", () => {
      expect(shouldExtract(0)).toBe(false);
      expect(shouldExtract(4)).toBe(false);
    });
  });
});
