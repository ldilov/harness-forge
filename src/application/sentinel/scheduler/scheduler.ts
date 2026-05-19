import type { LoadedMonitor } from "../monitor-engine/registry.js";

export interface SchedulerEntry {
  readonly monitor: LoadedMonitor;
  readonly nextRunAt: number;
  readonly lastRunAt: number | null;
  readonly consecutiveFailures: number;
}

export interface SchedulerOptions {
  readonly globalMinIntervalSeconds: number;
  readonly perMonitorJitterPercent: number;
  readonly now?: () => number;
  readonly random?: () => number;
}

function applyJitter(intervalMs: number, jitterPercent: number, random: () => number): number {
  if (jitterPercent <= 0) {
    return intervalMs;
  }
  const ratio = Math.max(0, Math.min(100, jitterPercent)) / 100;
  const range = intervalMs * ratio;
  const offset = (random() * 2 - 1) * range;
  return Math.max(0, Math.round(intervalMs + offset));
}

function backoffFor(consecutiveFailures: number, baseMs: number): number {
  if (consecutiveFailures <= 0) {
    return baseMs;
  }
  const factor = Math.min(2, 1 + consecutiveFailures * 0.5);
  return Math.round(baseMs * factor);
}

export class MonitorScheduler {
  private readonly entries: Map<string, SchedulerEntry> = new Map();
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly minIntervalMs: number;
  private readonly jitterPercent: number;

  constructor(monitors: readonly LoadedMonitor[], options: SchedulerOptions) {
    this.now = options.now ?? Date.now;
    this.random = options.random ?? Math.random;
    this.minIntervalMs = Math.max(1, options.globalMinIntervalSeconds) * 1000;
    this.jitterPercent = options.perMonitorJitterPercent;
    const startTime = this.now();
    for (const monitor of monitors) {
      this.entries.set(monitor.config.id, {
        monitor,
        nextRunAt: startTime,
        lastRunAt: null,
        consecutiveFailures: 0,
      });
    }
  }

  due(): readonly LoadedMonitor[] {
    const t = this.now();
    const ready: LoadedMonitor[] = [];
    for (const entry of this.entries.values()) {
      if (entry.nextRunAt <= t) {
        ready.push(entry.monitor);
      }
    }
    return ready;
  }

  recordSuccess(monitorId: string): void {
    const entry = this.entries.get(monitorId);
    if (entry === undefined) {
      return;
    }
    const baseMs = Math.max(this.minIntervalMs, entry.monitor.intervalSeconds * 1000);
    const next = this.now() + applyJitter(baseMs, this.jitterPercent, this.random);
    this.entries.set(monitorId, {
      monitor: entry.monitor,
      nextRunAt: next,
      lastRunAt: this.now(),
      consecutiveFailures: 0,
    });
  }

  recordFailure(monitorId: string): void {
    const entry = this.entries.get(monitorId);
    if (entry === undefined) {
      return;
    }
    const failures = entry.consecutiveFailures + 1;
    const baseMs = Math.max(this.minIntervalMs, entry.monitor.intervalSeconds * 1000);
    const backoff = backoffFor(failures, baseMs);
    const next = this.now() + applyJitter(backoff, this.jitterPercent, this.random);
    this.entries.set(monitorId, {
      monitor: entry.monitor,
      nextRunAt: next,
      lastRunAt: this.now(),
      consecutiveFailures: failures,
    });
  }

  recordSkip(monitorId: string, reason: string): void {
    const entry = this.entries.get(monitorId);
    if (entry === undefined) {
      return;
    }
    const baseMs = reason === "panic_stop" ? this.minIntervalMs : Math.max(this.minIntervalMs, entry.monitor.intervalSeconds * 1000);
    this.entries.set(monitorId, {
      monitor: entry.monitor,
      nextRunAt: this.now() + baseMs,
      lastRunAt: entry.lastRunAt,
      consecutiveFailures: entry.consecutiveFailures,
    });
  }

  inspect(): readonly SchedulerEntry[] {
    return [...this.entries.values()];
  }

  msUntilNext(): number {
    let nearest = Number.POSITIVE_INFINITY;
    const t = this.now();
    for (const entry of this.entries.values()) {
      const delta = entry.nextRunAt - t;
      if (delta < nearest) {
        nearest = delta;
      }
    }
    if (!Number.isFinite(nearest)) {
      return this.minIntervalMs;
    }
    return Math.max(0, nearest);
  }
}
