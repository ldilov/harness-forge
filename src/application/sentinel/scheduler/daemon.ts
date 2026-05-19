import { MonitorScheduler } from "./scheduler.js";
import { MonitorRunner } from "../monitor-engine/runner.js";
import {
  filterEnabledMonitors,
  loadMonitorRegistry,
  type LoadedMonitor,
} from "../monitor-engine/registry.js";
import { CadenceLedger } from "../budget/cadence-ledger.js";
import { loadBudgetSnapshot } from "../budget/budget-ledger.js";
import { acquirePidFile, type PidFileLock } from "../runtime/pid-file.js";
import { AbortRegistry } from "../runtime/abort-registry.js";
import { recoverInflightRuns } from "../safe-executor/checkpoint.js";

export interface DaemonOptions {
  readonly workspaceRoot: string;
  readonly profile?: string | null;
  readonly tickIntervalMs?: number;
  readonly stopWhen?: () => boolean;
  readonly onLog?: (line: string) => void;
}

export interface DaemonHandle {
  readonly stop: (reason?: string) => Promise<void>;
  readonly waitForExit: () => Promise<DaemonExitReason>;
  readonly registry: AbortRegistry;
}

export type DaemonExitReason = "stopped" | "panic_stop" | "no_monitors" | "config_invalid";

const DEFAULT_TICK_INTERVAL_MS = 1000;
const PANIC_POLL_INTERVAL_MS = 1000;

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise<void>((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      resolve();
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

export async function startDaemon(options: DaemonOptions): Promise<DaemonHandle> {
  const log = options.onLog ?? (() => undefined);
  const lock: PidFileLock = await acquirePidFile(options.workspaceRoot);
  log(`daemon started (pid ${lock.record.pid})`);

  const recovery = await recoverInflightRuns(options.workspaceRoot);
  if (recovery.orphanedRuns.length > 0) {
    log(`recovered ${recovery.orphanedRuns.length} orphan run(s) from previous daemon`);
  }

  const initialSnapshot = await loadBudgetSnapshot(options.workspaceRoot);
  const registry = await loadMonitorRegistry(options.workspaceRoot, initialSnapshot.cadence);
  if (registry.errors.length > 0) {
    log(`monitor registry errors: ${registry.errors.length}`);
  }
  const monitors: readonly LoadedMonitor[] = filterEnabledMonitors(registry.monitors);
  if (monitors.length === 0) {
    await lock.release();
    return {
      stop: async () => undefined,
      waitForExit: async () => "no_monitors" as const,
      registry: new AbortRegistry(),
    };
  }

  const scheduler = new MonitorScheduler(monitors, {
    globalMinIntervalSeconds: initialSnapshot.cadence.globalMinIntervalSeconds,
    perMonitorJitterPercent: initialSnapshot.cadence.perMonitorJitterPercent,
  });
  const runner = new MonitorRunner({ workspaceRoot: options.workspaceRoot, monitors });
  const cadenceLedger = new CadenceLedger(options.workspaceRoot);
  const abortRegistry = new AbortRegistry();
  const stopController = new AbortController();
  let exitReason: DaemonExitReason = "stopped";
  let resolveExit: ((reason: DaemonExitReason) => void) | null = null;
  const exitPromise = new Promise<DaemonExitReason>((resolve) => {
    resolveExit = resolve;
  });

  const stop = async (reason: string = "operator-stop"): Promise<void> => {
    if (stopController.signal.aborted) {
      return;
    }
    log(`daemon stopping: ${reason}`);
    stopController.abort(reason);
  };

  void (async () => {
    try {
      while (!stopController.signal.aborted) {
        const snapshot = await loadBudgetSnapshot(options.workspaceRoot);
        if (snapshot.cadence.panicStop) {
          const aborted = abortRegistry.abortAll("panic_stop");
          log(`panic stop: aborted ${aborted.length} in-flight run(s)`);
          await cadenceLedger.record({
            kind: "panic.toggle",
            subject: "daemon",
            detail: { halted: true, abortedRuns: aborted.length },
          });
          exitReason = "panic_stop";
          break;
        }

        const due = scheduler.due();
        for (const monitor of due) {
          if (stopController.signal.aborted) {
            break;
          }
          try {
            const outcomes = await runner.runOnce({ kind: monitor.config.id });
            const outcome = outcomes[0];
            if (outcome === undefined || outcome.skipped) {
              scheduler.recordSkip(monitor.config.id, outcome?.skipReason ?? "no_outcome");
              continue;
            }
            if (outcome.errors.length > 0) {
              scheduler.recordFailure(monitor.config.id);
              log(`monitor ${monitor.config.id} errored: ${outcome.errors.join(", ")}`);
            } else {
              scheduler.recordSuccess(monitor.config.id);
            }
          } catch (error: unknown) {
            scheduler.recordFailure(monitor.config.id);
            log(
              `monitor ${monitor.config.id} threw: ${
                error instanceof Error ? error.message : String(error)
              }`,
            );
          }
        }

        const sleepMs = Math.min(
          options.tickIntervalMs ?? DEFAULT_TICK_INTERVAL_MS,
          Math.max(scheduler.msUntilNext(), PANIC_POLL_INTERVAL_MS),
        );
        await sleep(sleepMs, stopController.signal);

        if (options.stopWhen !== undefined && options.stopWhen()) {
          break;
        }
      }
    } finally {
      await lock.release();
      log(`daemon exited: ${exitReason}`);
      if (resolveExit !== null) {
        resolveExit(exitReason);
      }
    }
  })();

  return {
    stop,
    waitForExit: () => exitPromise,
    registry: abortRegistry,
  };
}
