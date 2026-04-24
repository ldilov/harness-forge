import path from "node:path";
import fs from "node:fs/promises";

import type { DecisionIndex, DecisionIndexEntry, DecisionRecord } from "../../domain/runtime/decision-record.js";
import type { DecisionLog } from "../../domain/runtime/decision-log.js";
import { parseDecisionIndex, parseDecisionRecord } from "../../domain/runtime/decision-record.js";
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
import { compareISODesc } from "../../shared/timestamps.js";

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

export function resolveDecisionLogArtifactPaths(workspaceRoot: string): {
  decisionsDir: string;
  jsonPath: string;
  markdownPath: string;
} {
  const decisionsDir = decisionsRoot(workspaceRoot);
  return {
    decisionsDir,
    jsonPath: path.join(decisionsDir, "decision-log.json"),
    markdownPath: path.join(decisionsDir, "DECISION-LOG.md")
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
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

export function sortDecisionIndexEntries(entries: readonly DecisionIndexEntry[]): DecisionIndexEntry[] {
  return [...entries].sort((left, right) => {
    const chronological = compareISODesc(left.createdAt, right.createdAt);
    return chronological === 0 ? left.id.localeCompare(right.id) : chronological;
  });
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

export async function loadDecisionRecords(workspaceRoot: string): Promise<DecisionRecord[]> {
  const decisionsDir = decisionsRoot(workspaceRoot);
  if (!(await exists(decisionsDir))) {
    return [];
  }

  const entries = await fs.readdir(decisionsDir, { withFileTypes: true });
  const records: DecisionRecord[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json") || entry.name === RUNTIME_DECISION_INDEX_FILE) {
      continue;
    }
    const payload = await readJsonFile<unknown>(path.join(decisionsDir, entry.name));
    records.push(parseDecisionRecord(payload));
  }

  return records.sort((left, right) => {
    const chronological = compareISODesc(left.createdAt, right.createdAt);
    return chronological === 0 ? left.id.localeCompare(right.id) : chronological;
  });
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
    entries: sortDecisionIndexEntries([...existingEntries, indexEntry])
  };

  await Promise.all([
    writeJsonFile(paths.jsonPath, record),
    writeTextFile(paths.markdownPath, markdown),
    writeJsonFile(paths.indexPath, nextIndex)
  ]);

  return { record, indexEntry };
}

export async function writeDecisionLogArtifacts(
  workspaceRoot: string,
  log: DecisionLog,
  markdown: string
): Promise<{ jsonPath: string; markdownPath: string }> {
  const paths = resolveDecisionLogArtifactPaths(workspaceRoot);
  await ensureDir(paths.decisionsDir);
  await Promise.all([writeJsonFile(paths.jsonPath, log), writeTextFile(paths.markdownPath, markdown)]);
  return { jsonPath: paths.jsonPath, markdownPath: paths.markdownPath };
}
