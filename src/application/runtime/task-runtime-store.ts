import fs from "node:fs/promises";
import path from "node:path";

import type { RepoMap } from "../../domain/intelligence/repo-map.js";
import type { ImpactAnalysis } from "../../domain/runtime/impact-analysis.js";
import type { FileInterestDocument } from "../../domain/runtime/file-interest.js";
import type { TaskPack } from "../../domain/runtime/task-pack.js";
import type { RecursivePromotionState, RecursiveSessionStatus } from "../../domain/recursive/session.js";
import {
  RUNTIME_DIR,
  RUNTIME_FILE_INTEREST_FILE,
  RUNTIME_IMPACT_ANALYSIS_FILE,
  RUNTIME_REPO_DIR,
  RUNTIME_REPO_MAP_FILE,
  RUNTIME_TASK_RECURSIVE_LINK_FILE,
  RUNTIME_TASK_PACK_FILE,
  RUNTIME_TASKS_DIR,
  ensureDir,
  exists,
  readJsonFile,
  writeJsonFile
} from "../../shared/index.js";
import { evaluateTaskArtifactFreshness } from "./select-files-of-interest.js";

export interface PersistTaskAnalysisArtifactsInput {
  taskId: string;
  fileInterest: FileInterestDocument;
  impactAnalysis: ImpactAnalysis;
  taskPack?: TaskPack;
}

export interface TaskArtifactFreshnessRecord {
  path: string;
  taskId: string;
  artifactType: "file-interest" | "impact-analysis" | "task-pack";
  status: "fresh" | "stale";
  reasons: string[];
}

export interface RecursiveTaskLinkageRecord {
  taskId: string;
  sessionId: string;
  linkedAt: string;
  status: RecursiveSessionStatus;
  promotionState: RecursivePromotionState;
  sessionRef: string;
  summaryRef?: string;
}

function taskRoot(workspaceRoot: string, taskId: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_TASKS_DIR, taskId);
}

export function resolveTaskArtifactPaths(workspaceRoot: string, taskId: string): {
  taskDir: string;
  fileInterestPath: string;
  impactAnalysisPath: string;
  taskPackPath: string;
  recursiveSessionLinkPath: string;
} {
  const taskDir = taskRoot(workspaceRoot, taskId);
  return {
    taskDir,
    fileInterestPath: path.join(taskDir, RUNTIME_FILE_INTEREST_FILE),
    impactAnalysisPath: path.join(taskDir, RUNTIME_IMPACT_ANALYSIS_FILE),
    taskPackPath: path.join(taskDir, RUNTIME_TASK_PACK_FILE),
    recursiveSessionLinkPath: path.join(taskDir, RUNTIME_TASK_RECURSIVE_LINK_FILE)
  };
}

export async function persistTaskAnalysisArtifacts(
  workspaceRoot: string,
  input: PersistTaskAnalysisArtifactsInput
): Promise<string[]> {
  const paths = resolveTaskArtifactPaths(workspaceRoot, input.taskId);
  await ensureDir(paths.taskDir);
  const writes: Promise<void>[] = [
    writeJsonFile(paths.fileInterestPath, input.fileInterest),
    writeJsonFile(paths.impactAnalysisPath, input.impactAnalysis)
  ];
  if (input.taskPack) {
    writes.push(writeJsonFile(paths.taskPackPath, input.taskPack));
  }
  await Promise.all(writes);

  return [paths.fileInterestPath, paths.impactAnalysisPath, ...(input.taskPack ? [paths.taskPackPath] : [])];
}

export async function persistTaskRecursiveLinkage(
  workspaceRoot: string,
  linkage: RecursiveTaskLinkageRecord
): Promise<string> {
  const paths = resolveTaskArtifactPaths(workspaceRoot, linkage.taskId);
  await ensureDir(paths.taskDir);
  await writeJsonFile(paths.recursiveSessionLinkPath, linkage);
  return paths.recursiveSessionLinkPath;
}

async function loadWorkspaceRepoMap(workspaceRoot: string): Promise<RepoMap | null> {
  const repoMapPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, RUNTIME_REPO_MAP_FILE);
  if (!(await exists(repoMapPath))) {
    return null;
  }
  return readJsonFile<RepoMap>(repoMapPath);
}

export async function listStaleTaskAnalysisArtifacts(workspaceRoot: string): Promise<TaskArtifactFreshnessRecord[]> {
  const repoMap = await loadWorkspaceRepoMap(workspaceRoot);
  const tasksRoot = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_TASKS_DIR);
  if (!(await exists(tasksRoot))) {
    return [];
  }

  const entries = await fs.readdir(tasksRoot, { withFileTypes: true });
  const stale: TaskArtifactFreshnessRecord[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const { fileInterestPath, impactAnalysisPath, taskPackPath } = resolveTaskArtifactPaths(workspaceRoot, entry.name);
    for (const artifact of [
      { path: fileInterestPath, artifactType: "file-interest" as const },
      { path: impactAnalysisPath, artifactType: "impact-analysis" as const },
      { path: taskPackPath, artifactType: "task-pack" as const }
    ]) {
      if (!(await exists(artifact.path))) {
        continue;
      }

      const payload = await readJsonFile<{ generatedAt?: string; basedOnCommit?: string; taskId?: string }>(artifact.path);
      const freshness = evaluateTaskArtifactFreshness({
        artifactGeneratedAt: payload.generatedAt,
        repoMapGeneratedAt: repoMap?.generatedAt,
        artifactCommit: payload.basedOnCommit
      });

      if (freshness.status === "stale") {
        stale.push({
          path: artifact.path,
          taskId: payload.taskId ?? entry.name,
          artifactType: artifact.artifactType,
          status: freshness.status,
          reasons: freshness.reasons
        });
      }
    }
  }

  return stale.sort((left, right) => left.path.localeCompare(right.path));
}
