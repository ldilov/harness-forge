import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createAuditReport } from "../../src/application/maintenance/audit-install.js";
import { createDiffInstallReport } from "../../src/application/maintenance/diff-install.js";
import { deriveImpactAnalysis } from "../../src/application/runtime/derive-impact-analysis.js";
import { selectFilesOfInterest } from "../../src/application/runtime/select-files-of-interest.js";
import { persistTaskAnalysisArtifacts } from "../../src/application/runtime/task-runtime-store.js";
import { writeJsonFile } from "../../src/shared/index.js";
import type { RepoMap } from "../../src/domain/intelligence/repo-map.js";

const repoRoot = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("task runtime maintenance integration", () => {
  it("reports stale task artifacts when repo intelligence becomes newer", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-task-maintenance-"));
    tempRoots.push(workspaceRoot);

    const repoMapPath = path.join(workspaceRoot, ".hforge", "runtime", "repo", "repo-map.json");
    const repoMap = JSON.parse(
      await fs.readFile(path.join(repoRoot, "tests", "fixtures", "runtime", "task-aware-selection", "repo-map.json"), "utf8")
    ) as RepoMap;
    await writeJsonFile(repoMapPath, repoMap);

    const fileInterest = selectFilesOfInterest({
      taskId: "TASK-001",
      taskText: "add billing webhook retry handling and route tests",
      repoMap,
      candidateFiles: [
        {
          path: "src/billing/service.ts",
          role: "service-entry",
          symbols: ["retryWebhook"]
        },
        {
          path: "tests/billing/service.test.ts",
          role: "test"
        }
      ]
    });
    const impactAnalysis = deriveImpactAnalysis("TASK-001", fileInterest, repoMap);
    await persistTaskAnalysisArtifacts(workspaceRoot, {
      taskId: "TASK-001",
      fileInterest,
      impactAnalysis
    });

    await writeJsonFile(repoMapPath, {
      ...repoMap,
      generatedAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });

    const diffReport = await createDiffInstallReport(workspaceRoot);
    const auditReport = await createAuditReport(workspaceRoot, repoRoot);

    expect(diffReport.staleTaskArtifacts.some((entry) => entry.endsWith(path.join("TASK-001", "file-interest.json")))).toBe(true);
    expect(auditReport.staleTaskArtifacts.some((entry) => entry.path.endsWith(path.join("TASK-001", "impact-analysis.json")))).toBe(true);
  });
});
