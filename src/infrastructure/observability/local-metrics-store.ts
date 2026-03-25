import path from "node:path";

import {
  EFFECTIVENESS_FILE,
  ensureDir,
  exists,
  OBSERVABILITY_DIR,
  readJsonFile,
  writeJsonFile
} from "../../shared/index.js";

export interface EffectivenessSignalRecord {
  signalType: string;
  subjectId: string;
  context?: string;
  result: "success" | "skipped" | "failed" | "accepted" | "rejected";
  recordedAt: string;
  details?: Record<string, unknown>;
}

export interface EffectivenessSummary {
  total: number;
  bySignalType: Record<string, number>;
  byResult: Record<string, number>;
  latest?: EffectivenessSignalRecord;
}

function metricsPath(root: string): string {
  return path.join(root, OBSERVABILITY_DIR, EFFECTIVENESS_FILE);
}

export async function readEffectivenessSignals(root: string): Promise<EffectivenessSignalRecord[]> {
  const targetPath = metricsPath(root);
  if (!(await exists(targetPath))) {
    return [];
  }

  return readJsonFile<EffectivenessSignalRecord[]>(targetPath);
}

export async function appendEffectivenessSignal(root: string, signal: EffectivenessSignalRecord): Promise<void> {
  const targetDir = path.join(root, OBSERVABILITY_DIR);
  await ensureDir(targetDir);
  const signals = await readEffectivenessSignals(root);
  signals.push(signal);
  await writeJsonFile(metricsPath(root), signals);
}

export async function summarizeEffectivenessSignals(root: string): Promise<EffectivenessSummary> {
  const signals = await readEffectivenessSignals(root);
  const bySignalType: Record<string, number> = {};
  const byResult: Record<string, number> = {};

  for (const signal of signals) {
    bySignalType[signal.signalType] = (bySignalType[signal.signalType] ?? 0) + 1;
    byResult[signal.result] = (byResult[signal.result] ?? 0) + 1;
  }

  return {
    total: signals.length,
    bySignalType,
    byResult,
    latest: signals[signals.length - 1]
  };
}
