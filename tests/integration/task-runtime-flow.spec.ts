import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { deriveImpactAnalysis } from "../../src/application/runtime/derive-impact-analysis.js";
import { selectFilesOfInterest } from "../../src/application/runtime/select-files-of-interest.js";
import { persistTaskAnalysisArtifacts } from "../../src/application/runtime/task-runtime-store.js";
import type { RepoMap } from "../../src/domain/intelligence/repo-map.js";

const repoRoot = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("task runtime flow integration", () => {
  it("selects task-aware files, derives impact analysis, and persists both artifacts", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-task-runtime-"));
    tempRoots.push(workspaceRoot);

    const repoMap = JSON.parse(
      await fs.readFile(path.join(repoRoot, "tests", "fixtures", "runtime", "task-aware-selection", "repo-map.json"), "utf8")
    ) as RepoMap;
    const fileInterest = selectFilesOfInterest({
      taskId: "TASK-001",
      taskText: "add billing webhook retry handling and route tests",
      repoMap,
      candidateFiles: [
        {
          path: "src/billing/service.ts",
          role: "service-entry",
          symbols: ["retryWebhook", "billingService"]
        },
        {
          path: "src/api/routes/billing.ts",
          role: "router-entry",
          symbols: ["billingWebhookRoute"]
        },
        {
          path: "tests/billing/service.test.ts",
          role: "test"
        }
      ],
      basedOnCommit: "abc123"
    });
    const impactAnalysis = deriveImpactAnalysis("TASK-001", fileInterest, repoMap);

    const writtenFiles = await persistTaskAnalysisArtifacts(workspaceRoot, {
      taskId: "TASK-001",
      fileInterest,
      impactAnalysis
    });

    expect(writtenFiles).toHaveLength(2);
    const fileInterestPath = path.join(workspaceRoot, ".hforge", "runtime", "tasks", "TASK-001", "file-interest.json");
    const impactAnalysisPath = path.join(workspaceRoot, ".hforge", "runtime", "tasks", "TASK-001", "impact-analysis.json");
    expect(await fs.readFile(fileInterestPath, "utf8")).toContain("\"taskId\": \"TASK-001\"");
    expect(await fs.readFile(impactAnalysisPath, "utf8")).toContain("\"affectedModules\"");

    const persistedImpact = JSON.parse(await fs.readFile(impactAnalysisPath, "utf8")) as {
      architectureSignificance?: { level?: string };
      suggestedTests: string[];
      riskAreas: string[];
    };
    expect(["high", "critical"]).toContain(persistedImpact.architectureSignificance?.level);
    expect(persistedImpact.suggestedTests).toContain("tests/billing/service.test.ts");
    expect(persistedImpact.riskAreas).toContain("high-risk-path");
  });
});
