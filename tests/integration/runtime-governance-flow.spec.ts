import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createAsrRecord } from "../../src/application/runtime/create-asr-record.js";
import { deriveImpactAnalysis } from "../../src/application/runtime/derive-impact-analysis.js";
import { assessArchitectureSignificance } from "../../src/application/runtime/assess-architecture-significance.js";
import { selectFilesOfInterest } from "../../src/application/runtime/select-files-of-interest.js";
import { resolveDecisionArtifactPaths } from "../../src/application/runtime/decision-runtime-store.js";
import { persistTaskAnalysisArtifacts, resolveTaskArtifactPaths } from "../../src/application/runtime/task-runtime-store.js";
import type { RepoMap } from "../../src/domain/intelligence/repo-map.js";
import type { TaskPack } from "../../src/domain/runtime/task-pack.js";

const repoRoot = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("runtime governance flow integration", () => {
  it("persists significance-aware task artifacts and writes an ASR decision record", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-runtime-governance-"));
    tempRoots.push(workspaceRoot);

    const repoMap = JSON.parse(
      await fs.readFile(path.join(repoRoot, "tests", "fixtures", "runtime", "task-aware-selection", "repo-map.json"), "utf8")
    ) as RepoMap;
    const fileInterest = selectFilesOfInterest({
      taskId: "TASK-ARCH-001",
      taskText: "introduce billing retry orchestration across the billing route and service with durable retry state",
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
    const impactAnalysis = deriveImpactAnalysis("TASK-ARCH-001", fileInterest, repoMap);
    const architectureSignificance = assessArchitectureSignificance({
      taskId: "TASK-ARCH-001",
      taskText: fileInterest.taskText,
      impactAnalysis
    });
    const taskPack: TaskPack = {
      taskId: "TASK-ARCH-001",
      title: "Introduce billing event retry orchestration",
      generatedAt: new Date().toISOString(),
      basedOnCommit: "abc123",
      summary: "Coordinate billing retry behavior across the API route and billing service.",
      requestedOutcome: "Persist retry state and add validation coverage.",
      constraints: ["Keep the public billing route stable."],
      openQuestions: ["Should retry state be shared with operators?"],
      impactedModules: impactAnalysis.affectedModules.map((module) => module.id),
      architectureSignificance,
      fileInterestRef: ".hforge/runtime/tasks/TASK-ARCH-001/file-interest.json",
      impactAnalysisRef: ".hforge/runtime/tasks/TASK-ARCH-001/impact-analysis.json",
      decisionRefs: [],
      asrRefs: [],
      adrRefs: [],
      requirements: [
        {
          id: "REQ-001",
          title: "Persist retry state",
          description: "Retry state must survive failures.",
          priority: "high",
          affectedModules: ["billing-service"]
        },
        {
          id: "REQ-002",
          title: "Keep the route contract stable",
          description: "The billing route request contract must stay compatible.",
          priority: "high",
          affectedModules: ["api-service"]
        },
        {
          id: "REQ-003",
          title: "Cover the change with tests",
          description: "Route and service tests must prove retry behavior.",
          priority: "high",
          affectedModules: ["billing-service", "api-service"]
        }
      ],
      implementationNotes: [],
      acceptanceCriteria: ["Retries are durable.", "The route remains stable."],
      suggestedSequence: ["Persist retry state.", "Update route behavior.", "Add tests."],
      selectedTemplates: ["runtime/decision/asr-template"],
      provenance: ["specs/009-runtime-governance-enhancement/spec.md"],
      reviewStatus: "inferred"
    };

    await persistTaskAnalysisArtifacts(workspaceRoot, {
      taskId: taskPack.taskId,
      fileInterest,
      impactAnalysis,
      taskPack
    });
    const { record } = await createAsrRecord({
      workspaceRoot,
      taskPack,
      assessment: architectureSignificance,
      impactAnalysis
    });

    taskPack.decisionRefs = [record.id];
    taskPack.asrRefs = [record.id];
    await persistTaskAnalysisArtifacts(workspaceRoot, {
      taskId: taskPack.taskId,
      fileInterest,
      impactAnalysis,
      taskPack
    });

    const taskPaths = resolveTaskArtifactPaths(workspaceRoot, taskPack.taskId);
    const decisionPaths = resolveDecisionArtifactPaths(workspaceRoot, record.id);
    const persistedTaskPack = JSON.parse(await fs.readFile(taskPaths.taskPackPath, "utf8")) as {
      architectureSignificance?: { level?: string };
      asrRefs: string[];
    };
    const decisionIndex = JSON.parse(await fs.readFile(decisionPaths.indexPath, "utf8")) as {
      entries: Array<{ id: string }>;
    };

    expect(persistedTaskPack.architectureSignificance?.level).toBe("high");
    expect(persistedTaskPack.asrRefs).toContain(record.id);
    expect(await fs.readFile(decisionPaths.jsonPath, "utf8")).toContain("\"recordType\": \"asr\"");
    expect(await fs.readFile(decisionPaths.markdownPath, "utf8")).toContain("## Drivers");
    expect(decisionIndex.entries.some((entry) => entry.id === record.id)).toBe(true);
  });
});
