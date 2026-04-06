import path from "node:path";
import fs from "node:fs/promises";

import type { SessionTrace } from "../../domain/loop/session-trace.js";
import type { EffectivenessScore } from "../../domain/loop/effectiveness-score.js";
import { readJsonFile, writeJsonFile, ensureDir, exists } from "../../shared/fs.js";
import { appendNdjson } from "../../infrastructure/events/ndjson-writer.js";
import {
  RUNTIME_DIR,
  RUNTIME_TRACES_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_EFFECTIVENESS_LEDGER_FILE,
  RUNTIME_INSIGHTS_CHANGELOG_FILE,
} from "../../shared/constants.js";

function tracesDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_TRACES_DIR);
}

function insightsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INSIGHTS_DIR);
}

function traceFilePath(workspaceRoot: string, sessionId: string): string {
  return path.join(tracesDir(workspaceRoot), `session-${sessionId}.trace.json`);
}

function ledgerFilePath(workspaceRoot: string): string {
  return path.join(insightsDir(workspaceRoot), RUNTIME_EFFECTIVENESS_LEDGER_FILE);
}

function changelogFilePath(workspaceRoot: string): string {
  return path.join(insightsDir(workspaceRoot), RUNTIME_INSIGHTS_CHANGELOG_FILE);
}

export async function writeTrace(workspaceRoot: string, trace: SessionTrace): Promise<void> {
  const filePath = traceFilePath(workspaceRoot, trace.sessionId);
  await writeJsonFile(filePath, trace);
}

export async function appendScore(workspaceRoot: string, score: EffectivenessScore): Promise<void> {
  const filePath = ledgerFilePath(workspaceRoot);
  await appendNdjson(filePath, score);
}

export async function readTraces(
  workspaceRoot: string,
  options?: { readonly limit?: number },
): Promise<readonly SessionTrace[]> {
  const dir = tracesDir(workspaceRoot);
  if (!(await exists(dir))) {
    return [];
  }

  const entries = await fs.readdir(dir);
  const traceFiles = entries.filter((f) => f.endsWith(".trace.json"));

  const traces: SessionTrace[] = [];
  for (const file of traceFiles) {
    const trace = await readJsonFile<SessionTrace>(path.join(dir, file));
    traces.push(trace);
  }

  traces.sort((a, b) => {
    const ta = new Date(a.startedAt).getTime();
    const tb = new Date(b.startedAt).getTime();
    return tb - ta;
  });

  if (options?.limit !== undefined) {
    return traces.slice(0, options.limit);
  }

  return traces;
}

export async function readScores(
  workspaceRoot: string,
  options?: { readonly limit?: number },
): Promise<readonly EffectivenessScore[]> {
  const filePath = ledgerFilePath(workspaceRoot);
  if (!(await exists(filePath))) {
    return [];
  }

  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  const scores = lines.map((line) => JSON.parse(line) as EffectivenessScore);

  if (options?.limit !== undefined) {
    return scores.slice(0, options.limit);
  }

  return scores;
}

export async function countTracesSinceLastExtraction(workspaceRoot: string): Promise<number> {
  const dir = tracesDir(workspaceRoot);
  if (!(await exists(dir))) {
    return 0;
  }

  const changelog = changelogFilePath(workspaceRoot);
  let cutoff = "";

  if (await exists(changelog)) {
    const content = await fs.readFile(changelog, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length > 0) {
      const lastEntry = JSON.parse(lines[lines.length - 1]!) as { extractedAt?: string };
      cutoff = lastEntry.extractedAt ?? "";
    }
  }

  const entries = await fs.readdir(dir);
  const traceFiles = entries.filter((f) => f.endsWith(".trace.json"));

  if (!cutoff) {
    return traceFiles.length;
  }

  let count = 0;
  const cutoffTime = new Date(cutoff).getTime();

  for (const file of traceFiles) {
    const trace = await readJsonFile<SessionTrace>(path.join(dir, file));
    if (new Date(trace.startedAt).getTime() > cutoffTime) {
      count++;
    }
  }

  return count;
}
