import path from "node:path";
import fs from "node:fs/promises";

import { readJsonFile, writeJsonFile, ensureDir, exists } from "../../shared/fs.js";
import {
  RUNTIME_DIR,
  RUNTIME_TRACES_DIR,
  RUNTIME_INSIGHTS_DIR,
  RUNTIME_TRACE_DIGESTS_DIR,
  RUNTIME_TUNING_LOG_FILE,
  RUNTIME_INSIGHTS_CHANGELOG_FILE,
  RUNTIME_MERGE_LOG_FILE,
  LOOP_DEFAULT_HOT_DAYS,
  LOOP_DEFAULT_WARM_DAYS,
} from "../../shared/constants.js";
import type { SessionTrace } from "../../domain/loop/session-trace.js";
import type { EffectivenessScore } from "../../domain/loop/effectiveness-score.js";
import type { LoopRetentionPolicy, DailyTraceDigest, RetentionTier } from "../../domain/loop/retention-policy.js";
import { readScores } from "./trace-store.js";

const MS_PER_DAY = 86_400_000;

const DEFAULT_POLICY: LoopRetentionPolicy = {
  hotDays: LOOP_DEFAULT_HOT_DAYS,
  warmDays: LOOP_DEFAULT_WARM_DAYS,
};

export interface CompactionResult {
  readonly tracesCompacted: number;
  readonly tracesDeleted: number;
  readonly scoresCompacted: number;
  readonly digestsCreated: number;
  readonly bytesFreed: number;
}

function tracesDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_TRACES_DIR);
}

function digestsDir(workspaceRoot: string): string {
  return path.join(tracesDir(workspaceRoot), RUNTIME_TRACE_DIGESTS_DIR);
}

function insightsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INSIGHTS_DIR);
}

export function classifyTier(
  traceDate: string,
  now: Date,
  policy: LoopRetentionPolicy,
): RetentionTier {
  const traceTime = new Date(traceDate).getTime();
  const ageDays = (now.getTime() - traceTime) / MS_PER_DAY;

  if (ageDays <= policy.hotDays) {
    return "hot";
  }
  if (ageDays <= policy.warmDays) {
    return "warm";
  }
  return "cold";
}

async function fileSize(filePath: string): Promise<number> {
  try {
    const info = await fs.stat(filePath);
    return info.size;
  } catch {
    return 0;
  }
}

async function readTraceFiles(
  dir: string,
): Promise<readonly { readonly trace: SessionTrace; readonly fileName: string }[]> {
  if (!(await exists(dir))) {
    return [];
  }

  const entries = await fs.readdir(dir);
  const traceFiles = entries.filter((f) => f.endsWith(".trace.json"));

  const results: { trace: SessionTrace; fileName: string }[] = [];
  for (const fileName of traceFiles) {
    const trace = await readJsonFile<SessionTrace>(path.join(dir, fileName));
    results.push({ trace, fileName });
  }
  return results;
}

function buildScoreMap(
  scores: readonly EffectivenessScore[],
): ReadonlyMap<string, EffectivenessScore> {
  const map = new Map<string, EffectivenessScore>();
  for (const score of scores) {
    map.set(score.sessionId, score);
  }
  return map;
}

function buildDigest(
  date: string,
  traces: readonly SessionTrace[],
  scoreMap: ReadonlyMap<string, EffectivenessScore>,
): DailyTraceDigest {
  const scores = traces
    .map((t) => scoreMap.get(t.sessionId))
    .filter((s): s is EffectivenessScore => s !== undefined);

  const avgScore =
    scores.length > 0
      ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      : 0;

  const strategiesSet = new Set<string>();
  for (const t of traces) {
    for (const s of t.metrics.compactionStrategies) {
      strategiesSet.add(s);
    }
  }

  return {
    date,
    sessionCount: traces.length,
    avgScore: Math.round(avgScore * 100) / 100,
    totalTokensUsed: traces.reduce((sum, t) => sum + t.metrics.tokensUsed, 0),
    totalTokensSaved: traces.reduce((sum, t) => sum + t.metrics.tokensSaved, 0),
    compactionCount: traces.reduce((sum, t) => sum + t.metrics.compactionsTriggered, 0),
    topStrategies: [...strategiesSet],
    errorCount: traces.reduce((sum, t) => sum + t.metrics.errorsEncountered, 0),
  };
}

function dateFromISO(iso: string): string {
  return iso.slice(0, 10);
}

async function compactNdjsonFile(
  filePath: string,
  cutoffDate: Date,
  dateExtractor: (entry: Record<string, unknown>) => string | undefined,
): Promise<number> {
  if (!(await exists(filePath))) {
    return 0;
  }

  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return 0;
  }

  const originalSize = Buffer.byteLength(content, "utf-8");

  const kept: string[] = [];
  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as Record<string, unknown>;
      const dateStr = dateExtractor(entry);
      if (dateStr && new Date(dateStr).getTime() >= cutoffDate.getTime()) {
        kept.push(line);
      }
    } catch {
      // Skip malformed lines
    }
  }

  const newContent = kept.length > 0 ? kept.join("\n") + "\n" : "";
  await fs.writeFile(filePath, newContent, "utf-8");

  return Math.max(0, originalSize - Buffer.byteLength(newContent, "utf-8"));
}

export async function compactLoopData(
  workspaceRoot: string,
  policy?: LoopRetentionPolicy,
): Promise<CompactionResult> {
  const effectivePolicy = { ...DEFAULT_POLICY, ...policy };
  const now = new Date();
  const dir = tracesDir(workspaceRoot);

  const traceEntries = await readTraceFiles(dir);
  const allScores = traceEntries.length > 0 ? await readScores(workspaceRoot) : [];
  const scoreMap = buildScoreMap(allScores);

  const warmTraces: Map<string, { traces: SessionTrace[]; fileNames: string[] }> = new Map();
  const coldFileNames: string[] = [];
  let bytesFreed = 0;
  let tracesCompacted = 0;
  let tracesDeleted = 0;

  for (const { trace, fileName } of traceEntries) {
    const tier = classifyTier(trace.startedAt, now, effectivePolicy);

    if (tier === "warm") {
      const dateKey = dateFromISO(trace.startedAt);
      const bucket = warmTraces.get(dateKey) ?? { traces: [], fileNames: [] };
      bucket.traces.push(trace);
      bucket.fileNames.push(fileName);
      warmTraces.set(dateKey, bucket);
    } else if (tier === "cold") {
      coldFileNames.push(fileName);
    }
    // hot = do nothing
  }

  // Compact warm traces into daily digests
  let digestsCreated = 0;
  const digDir = digestsDir(workspaceRoot);

  for (const [date, bucket] of warmTraces) {
    const digest = buildDigest(date, bucket.traces, scoreMap);
    await ensureDir(digDir);
    await writeJsonFile(path.join(digDir, `${date}.digest.json`), digest);
    digestsCreated++;

    // Delete individual trace files for this date
    for (const fileName of bucket.fileNames) {
      const filePath = path.join(dir, fileName);
      bytesFreed += await fileSize(filePath);
      await fs.unlink(filePath);
      tracesCompacted++;
    }
  }

  // Delete cold trace files
  for (const fileName of coldFileNames) {
    const filePath = path.join(dir, fileName);
    bytesFreed += await fileSize(filePath);
    await fs.unlink(filePath);
    tracesDeleted++;
  }

  // Delete cold digests (digests older than warmDays)
  if (await exists(digDir)) {
    const digestFiles = await fs.readdir(digDir);
    for (const df of digestFiles) {
      if (!df.endsWith(".digest.json")) continue;
      const dateStr = df.replace(".digest.json", "");
      const tier = classifyTier(dateStr + "T00:00:00.000Z", now, effectivePolicy);
      if (tier === "cold") {
        const filePath = path.join(digDir, df);
        bytesFreed += await fileSize(filePath);
        await fs.unlink(filePath);
      }
    }
  }

  // Compact NDJSON logs — keep only last warmDays of entries
  const ndjsonCutoff = new Date(now.getTime() - effectivePolicy.warmDays * MS_PER_DAY);

  const tuningLogPath = path.join(insightsDir(workspaceRoot), RUNTIME_TUNING_LOG_FILE);
  bytesFreed += await compactNdjsonFile(tuningLogPath, ndjsonCutoff, (entry) => {
    return (entry.appliedAt as string | undefined) ?? (entry.rolledBackAt as string | undefined);
  });

  const changelogPath = path.join(insightsDir(workspaceRoot), RUNTIME_INSIGHTS_CHANGELOG_FILE);
  bytesFreed += await compactNdjsonFile(changelogPath, ndjsonCutoff, (entry) => {
    return entry.extractedAt as string | undefined;
  });

  const mergeLogPath = path.join(insightsDir(workspaceRoot), RUNTIME_MERGE_LOG_FILE);
  bytesFreed += await compactNdjsonFile(mergeLogPath, ndjsonCutoff, (entry) => {
    return entry.timestamp as string | undefined;
  });

  return {
    tracesCompacted,
    tracesDeleted,
    scoresCompacted: 0, // Ledger is append-only, not compacted
    digestsCreated,
    bytesFreed,
  };
}

export async function readDigests(
  workspaceRoot: string,
): Promise<readonly DailyTraceDigest[]> {
  const dir = digestsDir(workspaceRoot);
  if (!(await exists(dir))) {
    return [];
  }

  const entries = await fs.readdir(dir);
  const digestFiles = entries.filter((f) => f.endsWith(".digest.json")).sort();

  const digests: DailyTraceDigest[] = [];
  for (const file of digestFiles) {
    const digest = await readJsonFile<DailyTraceDigest>(path.join(dir, file));
    digests.push(digest);
  }
  return digests;
}
