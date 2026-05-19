import path from "node:path";
import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { Watchdog } from "../../application/sentinel/watchdog/watchdog.js";
import {
  WatchdogSignalSchema,
  type WatchdogSignal,
} from "../../domain/sentinel/watchdog/intervention.js";

interface WatchdogRootOptions {
  readonly root: string;
  readonly json?: boolean;
}

function resolveRoot(options: WatchdogRootOptions): string {
  return path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
}

function resolveSignal(value: string | undefined): WatchdogSignal {
  if (value === undefined) {
    return "agent.tool_failure_repeated";
  }
  const parsed = WatchdogSignalSchema.safeParse(value);
  return parsed.success ? parsed.data : "agent.tool_failure_repeated";
}

function describeStatus(status: string): string {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "paused":
      return "PAUSED";
    case "terminated":
      return "TERMINATED";
    default:
      return status.toUpperCase();
  }
}

export function registerWatchdogCommands(program: Command): void {
  const watchdog = program.command("watchdog").description("Sentinel agent watchdog");

  watchdog
    .command("status")
    .description("List active agent runs and their intervention status")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options: WatchdogRootOptions) => {
      const workspaceRoot = resolveRoot(options);
      const dog = new Watchdog(workspaceRoot);
      const runs = await dog.listRuns();
      if (options.json) {
        console.log(toJson({ runs }));
        return;
      }
      if (runs.length === 0) {
        console.log("No agent runs are being observed.");
        console.log("(The watchdog activates once agent step types — invoke_agent, write_file, apply_patch, open_pr — start landing.)");
        return;
      }
      for (const run of runs) {
        console.log(`[${describeStatus(run.status)}] ${run.runId}`);
        console.log(
          `  step=${run.interventionStep} interventions=${run.interventionCount} lastSignal=${run.lastSignal ?? "—"}`,
        );
        if (run.pausedReason !== null) {
          console.log(`  paused: ${run.pausedReason} (by ${run.pausedBy ?? "?"})`);
        }
      }
    });

  watchdog
    .command("events")
    .description("Stream the watchdog intervention ledger (newest last)")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .option("--run <id>", "filter by run id")
    .option("--limit <n>", "max records", "50")
    .action(
      async (
        options: WatchdogRootOptions & { readonly run?: string; readonly limit: string },
      ) => {
        const workspaceRoot = resolveRoot(options);
        const dog = new Watchdog(workspaceRoot);
        const limit = Math.max(1, Number.parseInt(options.limit, 10));
        const all = await dog.listInterventions(limit);
        const filtered = options.run === undefined ? all : all.filter((entry) => entry.runId === options.run);
        if (options.json) {
          console.log(toJson({ interventions: filtered }));
          return;
        }
        if (filtered.length === 0) {
          console.log("No watchdog interventions recorded.");
          return;
        }
        for (const entry of filtered) {
          console.log(`${entry.createdAt} ${entry.step} ${entry.signal} run=${entry.runId}`);
          console.log(`  ${entry.reason} (by ${entry.actor})`);
        }
      },
    );

  watchdog
    .command("pause <runId>")
    .description("Pause an agent run and record the intervention")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--reason <text>", "why the pause", "operator-pause")
    .option("--signal <signal>", "watchdog signal that justified the pause")
    .action(
      async (
        runId: string,
        options: WatchdogRootOptions & { readonly reason: string; readonly signal?: string },
      ) => {
        const workspaceRoot = resolveRoot(options);
        const dog = new Watchdog(workspaceRoot);
        const result = await dog.pause({
          runId,
          reason: options.reason,
          actor: process.env.USER ?? process.env.USERNAME ?? "operator",
          signal: resolveSignal(options.signal),
        });
        console.log(`Paused ${runId} (intervention #${result.state.interventionCount}, step=${result.state.interventionStep}).`);
      },
    );

  watchdog
    .command("resume <runId>")
    .description("Resume a previously paused agent run")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--reason <text>", "why the resume", "operator-resume")
    .action(
      async (runId: string, options: WatchdogRootOptions & { readonly reason: string }) => {
        const workspaceRoot = resolveRoot(options);
        const dog = new Watchdog(workspaceRoot);
        const state = await dog.resume({
          runId,
          actor: process.env.USER ?? process.env.USERNAME ?? "operator",
          reason: options.reason,
        });
        if (state === null) {
          console.error(`No agent run '${runId}' is registered with the watchdog.`);
          process.exitCode = 1;
          return;
        }
        console.log(`Resumed ${runId} (status=${state.status}).`);
      },
    );

  watchdog
    .command("explain <runId>")
    .description("Show the intervention history for a run + the next escalation step")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .option("--limit <n>", "max history records", "20")
    .action(
      async (
        runId: string,
        options: WatchdogRootOptions & { readonly limit: string },
      ) => {
        const workspaceRoot = resolveRoot(options);
        const dog = new Watchdog(workspaceRoot);
        const limit = Math.max(1, Number.parseInt(options.limit, 10));
        const explanation = await dog.explain(runId, limit);
        if (options.json) {
          console.log(toJson(explanation));
          return;
        }
        if (explanation.state === null) {
          console.log(`No watchdog state for run '${runId}' yet.`);
          return;
        }
        const state = explanation.state;
        console.log(`Run ${state.runId}`);
        console.log(`  status=${state.status} step=${state.interventionStep} interventions=${state.interventionCount}`);
        console.log(`  next-if-escalated=${explanation.nextStepIfEscalated ?? "(top of ladder)"}`);
        if (explanation.history.length === 0) {
          console.log("  history: (empty)");
          return;
        }
        console.log(`  history (${explanation.history.length}):`);
        for (const entry of explanation.history) {
          console.log(`    ${entry.createdAt} ${entry.step} ${entry.signal} — ${entry.reason} (by ${entry.actor})`);
        }
      },
    );
}
