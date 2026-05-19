import path from "node:path";
import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { dispatchHook } from "../../application/cartographer/dispatch-hook.js";
import { loadAgentTriggersConfig } from "../../application/cartographer/agent-triggers-config.js";
import { HookRunStore } from "../../infrastructure/cartographer/hook-run-store.js";
import { agentHookEventSchema } from "../../domain/cartographer/broker/hook-event.js";

interface HookOptions {
  readonly root: string;
  readonly event?: string;
  readonly goal?: string;
  readonly files?: string;
  readonly command?: string;
  readonly log?: string;
  readonly execute?: boolean;
  readonly json?: boolean;
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function registerAgentHookCommands(program: Command): void {
  const agent = program.command("agent").description("Cartographer+ agent command broker");

  agent
    .command("hook")
    .description("Dispatch an agent lifecycle event through the broker")
    .requiredOption("--event <event>", "lifecycle event")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--goal <goal>", "task goal")
    .option("--files <list>", "comma-separated files")
    .option("--command <command>", "related command")
    .option("--log <path>", "related log path")
    .option("--execute", "execute auto-executable diagnostic commands (honors autonomyLevel)")
    .option("--json", "machine-readable output")
    .action(async (options: HookOptions) => {
      const parsedEvent = agentHookEventSchema.safeParse(options.event);
      if (!parsedEvent.success) {
        process.stdout.write(
          options.json === true
            ? toJson({ status: "error", message: `unknown event: ${options.event}` }) + "\n"
            : `Unknown event: ${options.event}\n`,
        );
        process.exitCode = 2;
        return;
      }
      try {
        const { run } = await dispatchHook({
          workspaceRoot: path.resolve(options.root),
          execute: options.execute === true,
          payload: {
            event: parsedEvent.data,
            goal: options.goal,
            files: splitList(options.files),
            command: options.command,
            logPath: options.log,
          },
        });
        if (options.json === true) {
          process.stdout.write(toJson(run) + "\n");
          return;
        }
        process.stdout.write(
          `[${run.status}] ${run.event} → ${run.recommendedCommands.length} recommended, ` +
            `${run.executedCommands.length} executed (${run.mode}${run.cached ? ", cached" : ""}). ` +
            `Next: ${run.nextAction.hint}\n`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(
          options.json === true ? toJson({ status: "error", message }) + "\n" : `${message}\n`,
        );
        process.exitCode = 3;
      }
    });

  const hooks = agent.command("hooks").description("Inspect broker configuration and history");

  hooks
    .command("status")
    .description("Show broker autonomy posture")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "machine-readable output")
    .action(async (options: { root: string; json?: boolean }) => {
      const config = await loadAgentTriggersConfig(path.resolve(options.root));
      process.stdout.write(
        options.json === true
          ? toJson(config) + "\n"
          : `Broker: ${config.enabled ? "enabled" : "disabled"}, autonomy ${config.autonomyLevel}.\n`,
      );
    });

  hooks
    .command("list")
    .description("List recent broker runs")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--limit <n>", "max runs", "20")
    .option("--json", "machine-readable output")
    .action(async (options: { root: string; limit: string; json?: boolean }) => {
      const limit = Math.min(Math.max(Number.parseInt(options.limit, 10) || 20, 1), 500);
      const runs = await new HookRunStore(path.resolve(options.root)).recent(limit);
      process.stdout.write(
        options.json === true
          ? toJson({ runs }) + "\n"
          : `${runs.length} run(s): ${runs.map((r) => `${r.event}/${r.status}`).join(", ")}\n`,
      );
    });

  hooks
    .command("test")
    .description("Preview recommended commands for an event (dry-run, recorded for audit)")
    .requiredOption("--event <event>", "lifecycle event")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--goal <goal>", "task goal")
    .option("--json", "machine-readable output")
    .action(async (options: HookOptions) => {
      const parsedEvent = agentHookEventSchema.safeParse(options.event);
      if (!parsedEvent.success) {
        process.stdout.write(
          options.json === true
            ? toJson({ status: "error", message: `unknown event: ${options.event}` }) + "\n"
            : `Unknown event: ${options.event}\n`,
        );
        process.exitCode = 2;
        return;
      }
      const { run } = await dispatchHook({
        workspaceRoot: path.resolve(options.root),
        execute: false,
        payload: { event: parsedEvent.data, goal: options.goal, files: [] },
      });
      process.stdout.write(
        options.json === true
          ? toJson(run.recommendedCommands) + "\n"
          : `${run.recommendedCommands.length} recommended command(s) for ${run.event}.\n`,
      );
    });
}
