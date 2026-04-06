import fs from "node:fs/promises";
import path from "node:path";
import { exists, readJsonFile } from "../../shared/index.js";

const TRACES_DIR = ".hforge/runtime/traces";
const SCORES_DIR = ".hforge/runtime/scores";

/** A persisted session trace. */
export interface SessionTrace {
  readonly sessionId: string;
  readonly startedAt: string;
  readonly durationMs: number;
  readonly tokenCount: number;
  readonly compactions: number;
  readonly score?: number;
}

/** A persisted effectiveness score. */
export interface EffectivenessScore {
  readonly sessionId: string;
  readonly score: number;
  readonly breakdown: Record<string, number>;
  readonly recordedAt: string;
}

export interface ReadOptions {
  readonly limit?: number;
}

/** Read recent session traces, newest first. */
export async function readTraces(
  workspaceRoot: string,
  options?: ReadOptions,
): Promise<readonly SessionTrace[]> {
  const dir = path.join(workspaceRoot, TRACES_DIR);
  if (!(await exists(dir))) {
    return [];
  }

  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json")).sort().reverse();
  const limit = options?.limit ?? 5;
  const selected = files.slice(0, limit);

  const traces: SessionTrace[] = [];
  for (const file of selected) {
    const trace = await readJsonFile<SessionTrace>(path.join(dir, file));
    traces.push(trace);
  }
  return traces;
}

/** Read recent effectiveness scores, newest first. */
export async function readScores(
  workspaceRoot: string,
  options?: ReadOptions,
): Promise<readonly EffectivenessScore[]> {
  const dir = path.join(workspaceRoot, SCORES_DIR);
  if (!(await exists(dir))) {
    return [];
  }

  const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".json")).sort().reverse();
  const limit = options?.limit ?? 10;
  const selected = files.slice(0, limit);

  const scores: EffectivenessScore[] = [];
  for (const file of selected) {
    const score = await readJsonFile<EffectivenessScore>(path.join(dir, file));
    scores.push(score);
  }
  return scores;
}
