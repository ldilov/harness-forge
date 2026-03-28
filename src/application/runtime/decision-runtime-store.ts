import path from "node:path";

import type { DecisionIndex, DecisionIndexEntry, DecisionRecord } from "../../domain/runtime/decision-record.js";
import { parseDecisionIndex } from "../../domain/runtime/decision-record.js";
import {
  RUNTIME_DECISIONS_DIR,
  RUNTIME_DECISION_INDEX_FILE,
  RUNTIME_DIR,
  ensureDir,
  exists,
  readJsonFile,
  writeJsonFile,
  writeTextFile
} from "../../shared/index.js";

function decisionsRoot(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_DECISIONS_DIR);
}

export function resolveDecisionArtifactPaths(workspaceRoot: string, recordId: string): {
  decisionsDir: string;
  indexPath: string;
  jsonPath: string;
  markdownPath: string;
} {
  const decisionsDir = decisionsRoot(workspaceRoot);
  return {
    decisionsDir,
    indexPath: path.join(decisionsDir, RUNTIME_DECISION_INDEX_FILE),
    jsonPath: path.join(decisionsDir, `${recordId}.json`),
    markdownPath: path.join(decisionsDir, `${recordId}.md`)
  };
}

function toIndexEntry(record: DecisionRecord): DecisionIndexEntry {
  return {
    id: record.id,
    recordType: record.recordType,
    path: `.hforge/runtime/decisions/${record.id}.json`,
    title: record.title,
    status: record.status,
    architectureSignificance: record.architectureSignificance,
    taskRefs: [...record.taskRefs],
    supersedes: record.recordType === "adr" ? [...record.supersedes] : [],
    supersededBy: record.recordType === "adr" ? [...record.supersededBy] : [],
    reviewStatus: record.reviewStatus,
    updatedAt: record.updatedAt
  };
}

export async function loadDecisionIndex(workspaceRoot: string): Promise<DecisionIndex> {
  const { indexPath } = resolveDecisionArtifactPaths(workspaceRoot, "placeholder");
  if (!(await exists(indexPath))) {
    return {
      version: 1,
      generatedAt: new Date().toISOString(),
      entries: []
    };
  }

  return parseDecisionIndex(await readJsonFile<DecisionIndex>(indexPath));
}

export async function writeDecisionRecord(
  workspaceRoot: string,
  record: DecisionRecord,
  markdown: string
): Promise<{ record: DecisionRecord; indexEntry: DecisionIndexEntry }> {
  const paths = resolveDecisionArtifactPaths(workspaceRoot, record.id);
  await ensureDir(paths.decisionsDir);
  const index = await loadDecisionIndex(workspaceRoot);
  const indexEntry = toIndexEntry(record);
  const existingEntries = index.entries.filter((entry) => entry.id !== record.id);
  const nextIndex: DecisionIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    entries: [...existingEntries, indexEntry].sort((left, right) => left.id.localeCompare(right.id))
  };

  await Promise.all([
    writeJsonFile(paths.jsonPath, record),
    writeTextFile(paths.markdownPath, markdown),
    writeJsonFile(paths.indexPath, nextIndex)
  ]);

  return { record, indexEntry };
}
