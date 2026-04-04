import path from "node:path";

import {
  EFFECTIVENESS_FILE,
  ensureDir,
  exists,
  OBSERVABILITY_DIR,
  readJsonFile,
  writeJsonFile
} from "../../shared/index.js";
import type { EffectivenessDimensionScore } from "../../domain/runtime/effectiveness-dimension.js";
import type { StaleValueWarning } from "../../domain/runtime/stale-value-warning.js";
import { scoreEffectivenessDimensions } from "../../application/runtime/score-effectiveness-dimensions.js";
import { detectStaleWorkspace } from "../../application/runtime/detect-stale-workspace.js";

export interface EffectivenessSignalRecord {
  signalType: string;
  subjectId: string;
  context?: string;
  result: "success" | "skipped" | "failed" | "accepted" | "rejected";
  recordedAt: string;
  details?: Record<string, unknown>;
  category?: "install" | "firstRun" | "guidance" | "runtimeUsage" | "maintenance" | "recursive" | "handoff" | "outcomes" | "heuristics";
  confidenceLevel?: "direct" | "inferred-high" | "inferred-medium" | "inferred-low";
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

  try {
    return await readJsonFile<EffectivenessSignalRecord[]>(targetPath);
  } catch {
    // Gracefully degrade on corrupted observability files (spec edge case 4)
    return [];
  }
}

export async function appendEffectivenessSignal(root: string, signal: EffectivenessSignalRecord): Promise<void> {
  const targetDir = path.join(root, OBSERVABILITY_DIR);
  await ensureDir(targetDir);
  const signals = await readEffectivenessSignals(root);
  signals.push(signal);
  await writeJsonFile(metricsPath(root), signals);
}

export async function updateLastRuntimeCommandTimestamp(root: string): Promise<void> {
  const targetDir = path.join(root, OBSERVABILITY_DIR);
  await ensureDir(targetDir);
  await writeJsonFile(path.join(targetDir, "last-runtime-command.json"), {
    lastRuntimeCommandAt: new Date().toISOString()
  });
}

export async function readLastRuntimeCommandTimestamp(root: string): Promise<string | null> {
  const filePath = path.join(root, OBSERVABILITY_DIR, "last-runtime-command.json");
  if (!(await exists(filePath))) {
    return null;
  }
  const data = await readJsonFile<{ lastRuntimeCommandAt: string }>(filePath);
  return data.lastRuntimeCommandAt;
}

export async function appendGuidanceAdoptionSignal(
  root: string,
  suggestedCommand: string,
  executedCommand: string
): Promise<void> {
  await appendEffectivenessSignal(root, {
    signalType: "guidance-adoption",
    subjectId: suggestedCommand,
    result: suggestedCommand === executedCommand ? "accepted" : "skipped",
    recordedAt: new Date().toISOString(),
    category: "guidance",
    confidenceLevel: suggestedCommand === executedCommand ? "direct" : "inferred-medium",
    details: {
      suggestedCommand,
      executedCommand,
      matched: suggestedCommand === executedCommand
    }
  });
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

export interface EffectivenessSummaryV2 extends EffectivenessSummary {
  dimensions: EffectivenessDimensionScore[];
  staleWarnings: StaleValueWarning[];
  suggestedNextActions: string[];
}

function deriveSuggestedNextActions(dimensions: readonly EffectivenessDimensionScore[]): string[] {
  const sorted = [...dimensions].sort((a, b) => a.score - b.score);
  const actions: string[] = [];

  for (const dim of sorted.slice(0, 3)) {
    if (dim.score >= 60) break;
    switch (dim.dimensionId) {
      case "repoUnderstanding":
        actions.push("Run 'hforge init' or 'hforge bootstrap' to improve repo understanding signals.");
        break;
      case "targetCorrectness":
        actions.push("Run 'hforge install --target <target>' to improve target correctness signals.");
        break;
      case "runtimeAdoption":
        actions.push("Use runtime commands like 'hforge review' or 'hforge recursive run' to build adoption signals.");
        break;
      case "maintenanceHygiene":
        actions.push("Run 'hforge doctor' or 'hforge refresh' to improve maintenance hygiene signals.");
        break;
      case "workContinuity":
        actions.push("Use 'hforge recursive plan' for complex tasks to improve work continuity signals.");
        break;
      case "recommendationFollowThrough":
        actions.push("Accept guidance recommendations to improve follow-through signals.");
        break;
    }
  }

  return actions;
}

export async function summarizeEffectivenessSignalsV2(root: string): Promise<EffectivenessSummaryV2> {
  const signals = await readEffectivenessSignals(root);
  const base = await summarizeEffectivenessSignals(root);
  const lastCommand = await readLastRuntimeCommandTimestamp(root);
  const staleWarnings = detectStaleWorkspace(root, lastCommand);
  const dimensions = scoreEffectivenessDimensions(signals);
  const suggestedNextActions = deriveSuggestedNextActions(dimensions);

  return {
    ...base,
    dimensions,
    staleWarnings,
    suggestedNextActions
  };
}
