import path from "node:path";
import fs from "node:fs/promises";
import { Command } from "commander";
import { stringify as stringifyYaml, parse as parseYaml } from "yaml";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { ensureDir, exists, readTextFile, writeTextFile } from "../../shared/fs.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { loadBudgetSnapshot, BudgetGuard } from "../../application/sentinel/budget/budget-ledger.js";
import {
  filterEnabledMonitors,
  loadMonitorRegistry,
} from "../../application/sentinel/monitor-engine/registry.js";
import { MonitorRunner } from "../../application/sentinel/monitor-engine/runner.js";
import { sentinelMonitorsDir } from "../../domain/sentinel/paths.js";
import { PidFileBusyError, readPidRecord } from "../../application/sentinel/runtime/pid-file.js";
import { startDaemon } from "../../application/sentinel/scheduler/daemon.js";

interface MonitorRootOptions {
  readonly root: string;
  readonly json?: boolean;
}

function resolveRoot(options: MonitorRootOptions): string {
  return path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
}

async function loadEnabledMonitors(workspaceRoot: string) {
  const snapshot = await loadBudgetSnapshot(workspaceRoot);
  const registry = await loadMonitorRegistry(workspaceRoot, snapshot.cadence);
  return { snapshot, registry, enabled: filterEnabledMonitors(registry.monitors) };
}

export function registerMonitorCommands(program: Command): void {
  const monitor = program.command("monitor").description("Sentinel monitor engine");

  monitor
    .command("list")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options: MonitorRootOptions) => {
      const workspaceRoot = resolveRoot(options);
      const { registry } = await loadEnabledMonitors(workspaceRoot);
      const monitors = registry.monitors.map((monitor) => ({
        id: monitor.config.id,
        enabled: monitor.config.enabled,
        source: monitor.config.source,
        intervalSeconds: monitor.intervalSeconds,
        warnings: monitor.warnings,
        sourceFile: path.relative(workspaceRoot, monitor.sourceFile),
      }));
      if (options.json) {
        console.log(toJson({ monitors, errors: registry.errors }));
        return;
      }
      if (monitors.length === 0) {
        console.log(`No monitors found in ${path.relative(workspaceRoot, sentinelMonitorsDir(workspaceRoot))}.`);
        console.log("Run 'hforge monitor init-defaults' to seed the default Sentinel monitors.");
        return;
      }
      for (const m of monitors) {
        const flag = m.enabled ? "[on]" : "[off]";
        console.log(`${flag} ${m.id.padEnd(28)} source=${m.source.padEnd(28)} interval=${m.intervalSeconds}s`);
      }
      if (registry.errors.length > 0) {
        console.log("\nErrors:");
        for (const error of registry.errors) {
          console.log(`  ${path.relative(workspaceRoot, error.file)}: ${error.message}`);
        }
      }
    });

  monitor
    .command("status")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options: MonitorRootOptions) => {
      const workspaceRoot = resolveRoot(options);
      const { snapshot, registry, enabled } = await loadEnabledMonitors(workspaceRoot);
      const guard = new BudgetGuard(snapshot.budget, snapshot.cadence);
      const daemon = await readPidRecord(workspaceRoot);
      const status = {
        daemon,
        panicStop: guard.isPanicStopped(),
        profileSource: snapshot.source,
        budget: snapshot.budget,
        cadence: snapshot.cadence,
        monitorCount: registry.monitors.length,
        enabledCount: enabled.length,
        errors: registry.errors,
      };
      if (options.json) {
        console.log(toJson(status));
        return;
      }
      console.log(`Workspace: ${workspaceRoot}`);
      console.log(
        `Daemon: ${daemon === null ? "not running" : `running (pid ${daemon.pid} on ${daemon.hostname}, since ${daemon.startedAt})`}`,
      );
      console.log(`Panic stop: ${guard.isPanicStopped() ? "ON (autonomy halted)" : "off"}`);
      console.log(`Monitors: ${enabled.length} enabled / ${registry.monitors.length} total`);
      console.log(`LLM token daily budget: ${snapshot.budget.llmTokens.dailyBudget}`);
      console.log(`Max actions/hour: ${snapshot.cadence.maxActionsPerHour}`);
      if (registry.errors.length > 0) {
        console.log(`\nMonitor config errors: ${registry.errors.length}. Run 'hforge monitor list --json' to inspect.`);
      }
    });

  monitor
    .command("enable <id>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (id: string, options: MonitorRootOptions) => {
      const workspaceRoot = resolveRoot(options);
      await toggleMonitor(workspaceRoot, id, true);
      console.log(`Monitor '${id}' enabled.`);
    });

  monitor
    .command("disable <id>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (id: string, options: MonitorRootOptions) => {
      const workspaceRoot = resolveRoot(options);
      await toggleMonitor(workspaceRoot, id, false);
      console.log(`Monitor '${id}' disabled.`);
    });

  monitor
    .command("once")
    .description("Run all enabled monitors one tick")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .option("--kind <kind>", "limit to one monitor id or source")
    .action(async (options: MonitorRootOptions & { readonly kind?: string }) => {
      const workspaceRoot = resolveRoot(options);
      const { enabled } = await loadEnabledMonitors(workspaceRoot);
      const runner = new MonitorRunner({ workspaceRoot, monitors: enabled });
      const outcomes = await runner.runOnce({ kind: options.kind });
      if (options.json) {
        console.log(toJson({ outcomes }));
        return;
      }
      if (outcomes.length === 0) {
        console.log("No enabled monitors matched the request.");
        return;
      }
      let totalNew = 0;
      let totalDeduped = 0;
      let totalErrors = 0;
      for (const outcome of outcomes) {
        if (outcome.skipped) {
          console.log(`- ${outcome.monitorId}: skipped (${outcome.skipReason ?? "unknown"})`);
          continue;
        }
        const newCount = outcome.observations.length - outcome.dedupedCount;
        totalNew += newCount;
        totalDeduped += outcome.dedupedCount;
        totalErrors += outcome.errors.length;
        console.log(
          `- ${outcome.monitorId}: ${newCount} new, ${outcome.dedupedCount} dedup, ${outcome.errors.length} error(s) in ${outcome.durationMs}ms`,
        );
      }
      console.log(`Total: ${totalNew} new, ${totalDeduped} dedup, ${totalErrors} error(s).`);
    });

  monitor
    .command("run")
    .description("Run the Sentinel monitor daemon (foreground; Ctrl+C to drain)")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--profile <name>", "autonomy profile to apply for this session")
    .option("--max-ticks <n>", "exit after N ticks (smoke / CI use)")
    .action(
      async (
        options: MonitorRootOptions & {
          readonly profile?: string;
          readonly maxTicks?: string;
        },
      ) => {
        const workspaceRoot = resolveRoot(options);
        const maxTicks =
          options.maxTicks === undefined ? null : Math.max(1, Number.parseInt(options.maxTicks, 10));
        let ticks = 0;
        const stopWhen =
          maxTicks === null
            ? undefined
            : (): boolean => {
                ticks += 1;
                return ticks >= maxTicks;
              };
        try {
          const handle = await startDaemon({
            workspaceRoot,
            profile: options.profile ?? null,
            stopWhen,
            onLog: (line) => console.log(line),
          });
          const handleSignal = (sig: NodeJS.Signals): void => {
            console.log(`received ${sig}, draining daemon`);
            void handle.stop(sig);
          };
          process.on("SIGINT", handleSignal);
          process.on("SIGTERM", handleSignal);
          const reason = await handle.waitForExit();
          process.off("SIGINT", handleSignal);
          process.off("SIGTERM", handleSignal);
          if (reason === "panic_stop") {
            process.exitCode = 0;
          } else if (reason === "no_monitors") {
            console.log("No enabled monitors found. Add one under .hforge/monitors/ and try again.");
            process.exitCode = 1;
          }
        } catch (error: unknown) {
          if (error instanceof PidFileBusyError) {
            console.error(error.message);
            process.exitCode = 5;
            return;
          }
          throw error;
        }
      },
    );

  monitor
    .command("stop")
    .description("Stop the Sentinel monitor daemon (sends SIGTERM to the recorded pid)")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (options: MonitorRootOptions) => {
      const workspaceRoot = resolveRoot(options);
      const record = await readPidRecord(workspaceRoot);
      if (record === null) {
        console.log("No daemon is running.");
        return;
      }
      try {
        process.kill(record.pid, "SIGTERM");
        console.log(`Sent SIGTERM to pid ${record.pid}.`);
      } catch (error: unknown) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code === "ESRCH") {
          console.log(`pid ${record.pid} is no longer running; the pid file may be stale.`);
          return;
        }
        console.error(`Failed to signal pid ${record.pid}: ${(error as Error).message}`);
        process.exitCode = 1;
      }
    });

  monitor
    .command("init-defaults")
    .description("Copy bundled default monitors into .hforge/monitors/")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--force", "overwrite existing files", false)
    .action(async (options: MonitorRootOptions & { readonly force?: boolean }) => {
      const workspaceRoot = resolveRoot(options);
      const written = await initDefaultMonitors(workspaceRoot, options.force ?? false);
      if (written.length === 0) {
        console.log("No defaults written. Pass --force to overwrite existing files.");
        return;
      }
      console.log(`Wrote ${written.length} default monitor(s):`);
      for (const file of written) {
        console.log(`  ${path.relative(workspaceRoot, file)}`);
      }
    });
}

async function toggleMonitor(workspaceRoot: string, id: string, enabled: boolean): Promise<void> {
  const dir = sentinelMonitorsDir(workspaceRoot);
  const candidates = [path.join(dir, `${id}.yaml`), path.join(dir, `${id}.yml`)];
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      const raw = await readTextFile(candidate);
      const parsed = (parseYaml(raw) ?? {}) as Record<string, unknown>;
      parsed.enabled = enabled;
      await writeTextFile(candidate, stringifyYaml(parsed));
      return;
    }
  }
  throw new Error(`monitor '${id}' not found in ${dir}`);
}

async function initDefaultMonitors(workspaceRoot: string, force: boolean): Promise<readonly string[]> {
  const sourceDir = path.resolve(import.meta.dirname, "..", "..", "..", "templates", "sentinel", "monitors");
  if (!(await exists(sourceDir))) {
    return [];
  }
  const targetDir = sentinelMonitorsDir(workspaceRoot);
  await ensureDir(targetDir);
  const entries = await fs.readdir(sourceDir);
  const yamlFiles = entries.filter((entry) => entry.endsWith(".yaml") || entry.endsWith(".yml"));
  const written: string[] = [];
  for (const fileName of yamlFiles) {
    const target = path.join(targetDir, fileName);
    if (!force && (await exists(target))) {
      continue;
    }
    const content = await readTextFile(path.join(sourceDir, fileName));
    await writeTextFile(target, content);
    written.push(target);
  }
  return written;
}
