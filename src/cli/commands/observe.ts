import path from "node:path";
import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { ObservationStore } from "../../infrastructure/sentinel/stores/observation-store.js";
import type { Observation } from "../../domain/sentinel/observation/observation.js";
import type { Severity } from "../../domain/sentinel/monitor/monitor.js";

const SEVERITY_RANK: Readonly<Record<Severity, number>> = {
  info: 0,
  notice: 1,
  warning: 2,
  critical: 3,
};

function rankOf(severity: Severity): number {
  const value = SEVERITY_RANK[severity];
  return value === undefined ? 0 : value;
}

interface ObserveOptions {
  readonly root: string;
  readonly json?: boolean;
  readonly severity?: Severity;
  readonly source?: string;
  readonly limit?: string;
  readonly since?: string;
}

function parseDuration(value: string | undefined): number | null {
  if (value === undefined) {
    return null;
  }
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (match === null) {
    return null;
  }
  const amount = Number.parseInt(match[1]!, 10);
  switch (match[2]) {
    case "ms":
      return amount;
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60_000;
    case "h":
      return amount * 3_600_000;
    case "d":
      return amount * 86_400_000;
    default:
      return null;
  }
}

function applyFilters(records: readonly Observation[], options: ObserveOptions): readonly Observation[] {
  const sinceMs = parseDuration(options.since);
  const cutoff = sinceMs === null ? null : Date.now() - sinceMs;
  const minRank = options.severity === undefined ? 0 : rankOf(options.severity);
  const limit = options.limit === undefined ? null : Math.max(1, Number.parseInt(options.limit, 10));
  let filtered = records.filter((record) => {
    if (options.source !== undefined && record.source !== options.source) {
      return false;
    }
    if (rankOf(record.severity) < minRank) {
      return false;
    }
    if (cutoff !== null) {
      const detectedAt = Date.parse(record.detectedAt);
      if (Number.isNaN(detectedAt) || detectedAt < cutoff) {
        return false;
      }
    }
    return true;
  });
  filtered = [...filtered].sort((a, b) => Date.parse(b.detectedAt) - Date.parse(a.detectedAt));
  if (limit !== null) {
    filtered = filtered.slice(0, limit);
  }
  return filtered;
}

export function registerObserveCommands(program: Command): void {
  program
    .command("observe")
    .description("Show recent Sentinel observations")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .option("--severity <level>", "minimum severity (info|notice|warning|critical)")
    .option("--source <id>", "filter by source adapter id")
    .option("--limit <n>", "maximum records", "20")
    .option("--since <duration>", "lookback window e.g. 5m, 2h, 1d")
    .action(async (options: ObserveOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new ObservationStore(workspaceRoot);
      const all = await store.readAll();
      const filtered = applyFilters(all, options);
      if (options.json) {
        console.log(toJson({ observations: filtered }));
        return;
      }
      if (filtered.length === 0) {
        console.log("No observations match. Run 'hforge monitor once' to collect some.");
        return;
      }
      for (const observation of filtered) {
        const tag = `[${observation.severity}]`;
        const occ = observation.occurrenceCount && observation.occurrenceCount > 1
          ? ` x${observation.occurrenceCount}`
          : "";
        console.log(`${tag} ${observation.subject}${occ}`);
        console.log(`    ${observation.summary}`);
        const evidence = observation.evidence.slice(0, 3).map((e) => `${e.kind}:${e.ref}`).join(", ");
        console.log(`    evidence: ${evidence}`);
        console.log(`    seen: ${observation.detectedAt}  source: ${observation.source}`);
      }
    });
}
