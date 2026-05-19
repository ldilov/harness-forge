import path from "node:path";
import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import {
  SignalStore,
  SuppressionStore,
} from "../../infrastructure/sentinel/stores/signal-store.js";
import { SuppressionFilter } from "../../application/sentinel/classifier/suppressor.js";
import type { Signal, SignalCategory } from "../../domain/sentinel/signal/signal.js";
import type { Severity } from "../../domain/sentinel/monitor/monitor.js";
import { nowISO } from "../../shared/timestamps.js";

const SEVERITY_RANK: Readonly<Record<Severity, number>> = {
  info: 0,
  notice: 1,
  warning: 2,
  critical: 3,
};

interface SignalsOptions {
  readonly root: string;
  readonly json?: boolean;
  readonly category?: SignalCategory;
  readonly severity?: Severity;
  readonly status?: Signal["status"];
  readonly limit?: string;
}

function rankOf(severity: Severity): number {
  const value = SEVERITY_RANK[severity];
  return value === undefined ? 0 : value;
}

function parseDuration(value: string): number | null {
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

function applyFilters(signals: readonly Signal[], options: SignalsOptions): readonly Signal[] {
  const minRank = options.severity === undefined ? 0 : rankOf(options.severity);
  const limit = options.limit === undefined ? null : Math.max(1, Number.parseInt(options.limit, 10));
  let filtered = signals.filter((signal) => {
    if (options.category !== undefined && signal.category !== options.category) {
      return false;
    }
    if (options.status !== undefined && signal.status !== options.status) {
      return false;
    }
    if (rankOf(signal.severity) < minRank) {
      return false;
    }
    return true;
  });
  filtered = [...filtered].sort((a, b) => b.priority - a.priority);
  if (limit !== null) {
    filtered = filtered.slice(0, limit);
  }
  return filtered;
}

export function registerSignalsCommands(program: Command): void {
  const signals = program.command("signals").description("Sentinel signals");

  signals
    .command("list", { isDefault: true })
    .description("List signals sorted by priority (descending)")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .option("--category <category>", "filter by category")
    .option("--severity <level>", "minimum severity")
    .option("--status <status>", "filter by status")
    .option("--limit <n>", "maximum records", "20")
    .action(async (options: SignalsOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new SignalStore(workspaceRoot);
      const suppressions = new SuppressionStore(workspaceRoot);
      const filter = new SuppressionFilter(suppressions);
      const all = await store.readAll();
      const projected = await filter.apply(all);
      const filtered = applyFilters(projected, options);
      if (options.json) {
        console.log(toJson({ signals: filtered }));
        return;
      }
      if (filtered.length === 0) {
        console.log("No signals match. Run 'hforge monitor once' to collect observations first.");
        return;
      }
      for (const signal of filtered) {
        const tag = `[${signal.severity}]`;
        const status = signal.status === "open" ? "" : ` (${signal.status})`;
        console.log(`${tag} p=${signal.priority} ${signal.title}${status}`);
        console.log(`    ${signal.summary}`);
        console.log(`    category=${signal.category} intent=${signal.recommendedIntent ?? "none"} id=${signal.id}`);
      }
    });

  signals
    .command("show <id>")
    .description("Show full signal detail with linked observations")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (id: string, options: SignalsOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new SignalStore(workspaceRoot);
      const signal = await store.findById(id);
      if (signal === null) {
        console.error(`Signal '${id}' not found.`);
        process.exitCode = 1;
        return;
      }
      if (options.json) {
        console.log(toJson({ signal }));
        return;
      }
      console.log(`Signal ${signal.id}`);
      console.log(`  status=${signal.status} severity=${signal.severity} priority=${signal.priority}`);
      console.log(`  category=${signal.category} intent=${signal.recommendedIntent ?? "none"}`);
      console.log(`  title: ${signal.title}`);
      console.log(`  summary: ${signal.summary}`);
      console.log(`  observations: ${signal.observationIds.join(", ")}`);
      console.log(`  created: ${signal.createdAt}`);
      console.log(`  updated: ${signal.updatedAt}`);
    });

  signals
    .command("suppress <id>")
    .description("Suppress a signal until expiry or forever")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--until <duration>", "expire after this duration (e.g. 7d, 4h)")
    .option("--forever", "never expire", false)
    .option("--reason <text>", "why this suppression exists", "operator-suppress")
    .action(
      async (
        id: string,
        options: { readonly root: string; readonly until?: string; readonly forever?: boolean; readonly reason: string },
      ) => {
        const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
        const store = new SignalStore(workspaceRoot);
        const signal = await store.findById(id);
        if (signal === null) {
          console.error(`Signal '${id}' not found.`);
          process.exitCode = 1;
          return;
        }
        let expiresAt: string | null = null;
        if (options.forever !== true) {
          if (options.until === undefined) {
            console.error("Pass either --until <duration> or --forever.");
            process.exitCode = 1;
            return;
          }
          const ms = parseDuration(options.until);
          if (ms === null) {
            console.error(`Invalid --until duration: ${options.until}`);
            process.exitCode = 1;
            return;
          }
          expiresAt = new Date(Date.now() + ms).toISOString();
        }
        const suppressions = new SuppressionStore(workspaceRoot);
        await suppressions.add({
          signalId: id,
          reason: options.reason,
          actor: process.env.USER ?? process.env.USERNAME ?? "operator",
          suppressedAt: nowISO(),
          expiresAt,
        });
        console.log(`Signal ${id} suppressed${expiresAt === null ? " forever" : ` until ${expiresAt}`}.`);
      },
    );

  signals
    .command("resolve <id>")
    .description("Mark a signal resolved")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--reason <text>", "why this is resolved", "operator-resolve")
    .action(async (id: string, options: { readonly root: string; readonly reason: string }) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new SignalStore(workspaceRoot);
      const signal = await store.findById(id);
      if (signal === null) {
        console.error(`Signal '${id}' not found.`);
        process.exitCode = 1;
        return;
      }
      await store.upsert({ ...signal, status: "resolved", updatedAt: nowISO() });
      console.log(`Signal ${id} resolved (${options.reason}).`);
    });
}
