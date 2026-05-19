import { describe, expect, it } from "vitest";

import { MonitorScheduler } from "../../../src/application/sentinel/scheduler/scheduler.js";
import type { LoadedMonitor } from "../../../src/application/sentinel/monitor-engine/registry.js";
import { MonitorConfigSchema } from "../../../src/domain/sentinel/monitor/monitor.js";

function makeMonitor(id: string, intervalSeconds = 60): LoadedMonitor {
  const config = MonitorConfigSchema.parse({
    id,
    enabled: true,
    source: "harness.repo_drift",
    interval: `${intervalSeconds}s`,
    dedupe: { fingerprint: "x:${subject}" },
  });
  return { config, intervalSeconds, sourceFile: `${id}.yaml`, warnings: [] };
}

describe("MonitorScheduler", () => {
  it("seeds nextRunAt at startTime so the daemon's first tick fires immediately", () => {
    const start = 1_000_000_000_000;
    const scheduler = new MonitorScheduler([makeMonitor("a")], {
      globalMinIntervalSeconds: 30,
      perMonitorJitterPercent: 0,
      now: () => start,
      random: () => 0,
    });
    const entries = scheduler.inspect();
    expect(entries[0]?.nextRunAt).toBe(start);
    expect(scheduler.due()).toHaveLength(1);
  });

  it("due() returns monitors whose nextRunAt is now or earlier", () => {
    let t = 0;
    const scheduler = new MonitorScheduler([makeMonitor("a", 60)], {
      globalMinIntervalSeconds: 1,
      perMonitorJitterPercent: 0,
      now: () => t,
      random: () => 0,
    });
    expect(scheduler.due()).toHaveLength(1);
    scheduler.recordSuccess("a");
    expect(scheduler.due()).toHaveLength(0);
    t = 70_000;
    expect(scheduler.due()).toHaveLength(1);
  });

  it("recordSuccess advances nextRunAt by the monitor's own interval", () => {
    let t = 0;
    const scheduler = new MonitorScheduler([makeMonitor("a", 60)], {
      globalMinIntervalSeconds: 1,
      perMonitorJitterPercent: 0,
      now: () => t,
      random: () => 0,
    });
    t = 5_000;
    scheduler.recordSuccess("a");
    const entries = scheduler.inspect();
    expect(entries[0]?.nextRunAt).toBe(5_000 + 60_000);
    expect(entries[0]?.consecutiveFailures).toBe(0);
  });

  it("recordFailure backs off and increments the failure counter", () => {
    let t = 0;
    const scheduler = new MonitorScheduler([makeMonitor("a", 60)], {
      globalMinIntervalSeconds: 1,
      perMonitorJitterPercent: 0,
      now: () => t,
      random: () => 0,
    });
    t = 5_000;
    scheduler.recordFailure("a");
    let entries = scheduler.inspect();
    expect(entries[0]?.consecutiveFailures).toBe(1);
    const firstNext = entries[0]?.nextRunAt ?? 0;
    expect(firstNext).toBeGreaterThan(5_000 + 60_000);
    scheduler.recordFailure("a");
    entries = scheduler.inspect();
    expect(entries[0]?.consecutiveFailures).toBe(2);
    expect(entries[0]?.nextRunAt ?? 0).toBeGreaterThan(firstNext);
  });

  it("msUntilNext returns 0 when something is currently due", () => {
    let t = 0;
    const scheduler = new MonitorScheduler([makeMonitor("a", 1)], {
      globalMinIntervalSeconds: 1,
      perMonitorJitterPercent: 0,
      now: () => t,
      random: () => 0,
    });
    t = 5_000;
    expect(scheduler.msUntilNext()).toBe(0);
  });

  it("applies jitter on recordSuccess so consecutive runs don't align", () => {
    const seq = [0, 1, 0.25, 0.75];
    let i = 0;
    const random = (): number => {
      const v = seq[i % seq.length] ?? 0;
      i += 1;
      return v;
    };
    let t = 0;
    const scheduler = new MonitorScheduler([makeMonitor("a", 60)], {
      globalMinIntervalSeconds: 1,
      perMonitorJitterPercent: 50,
      now: () => t,
      random,
    });
    t = 5_000;
    scheduler.recordSuccess("a");
    const after = scheduler.inspect()[0]?.nextRunAt ?? 0;
    expect(after).toBeGreaterThanOrEqual(5_000 + 30_000);
    expect(after).toBeLessThanOrEqual(5_000 + 90_000);
  });
});
