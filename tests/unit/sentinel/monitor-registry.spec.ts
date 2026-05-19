import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_CADENCE } from "../../../src/application/sentinel/budget/budget-ledger.js";
import {
  filterEnabledMonitors,
  loadMonitorRegistry,
} from "../../../src/application/sentinel/monitor-engine/registry.js";
import { sentinelMonitorsDir } from "../../../src/domain/sentinel/paths.js";

const VALID_YAML = `
id: sample
enabled: true
source: harness.repo_drift
interval: 5m
dedupe:
  fingerprint: "x:\${subject}"
`;

const SUBSECOND_INTERVAL_YAML = `
id: tiny
enabled: true
source: harness.repo_drift
interval: 1s
dedupe:
  fingerprint: "x:\${subject}"
`;

const DISABLED_YAML = `
id: off
enabled: false
source: harness.repo_drift
interval: 5m
dedupe:
  fingerprint: "x:\${subject}"
`;

const INVALID_YAML = `
id: bad
enabled: true
source: harness.repo_drift
dedupe:
  fingerprint: "x:\${subject}"
`;

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-registry-"));
  await fs.mkdir(sentinelMonitorsDir(workspace), { recursive: true });
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

async function writeMonitor(name: string, content: string): Promise<void> {
  await fs.writeFile(path.join(sentinelMonitorsDir(workspace), name), content, "utf8");
}

describe("loadMonitorRegistry", () => {
  it("loads valid yaml and parses interval to seconds", async () => {
    await writeMonitor("sample.yaml", VALID_YAML);
    const result = await loadMonitorRegistry(workspace, DEFAULT_CADENCE);
    expect(result.errors).toEqual([]);
    expect(result.monitors).toHaveLength(1);
    expect(result.monitors[0]?.intervalSeconds).toBe(300);
  });

  it("coerces sub-floor intervals up to the global minimum and adds a warning", async () => {
    await writeMonitor("tiny.yaml", SUBSECOND_INTERVAL_YAML);
    const result = await loadMonitorRegistry(workspace, DEFAULT_CADENCE);
    expect(result.monitors[0]?.intervalSeconds).toBe(DEFAULT_CADENCE.globalMinIntervalSeconds);
    expect(result.monitors[0]?.warnings.length).toBeGreaterThan(0);
  });

  it("collects errors instead of throwing on invalid configs", async () => {
    await writeMonitor("bad.yaml", INVALID_YAML);
    const result = await loadMonitorRegistry(workspace, DEFAULT_CADENCE);
    expect(result.monitors).toEqual([]);
    expect(result.errors).toHaveLength(1);
  });

  it("filterEnabledMonitors drops disabled entries", async () => {
    await writeMonitor("on.yaml", VALID_YAML);
    await writeMonitor("off.yaml", DISABLED_YAML);
    const result = await loadMonitorRegistry(workspace, DEFAULT_CADENCE);
    expect(result.monitors).toHaveLength(2);
    expect(filterEnabledMonitors(result.monitors)).toHaveLength(1);
  });

  it("returns empty when monitors directory is absent", async () => {
    const fresh = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-empty-"));
    try {
      const result = await loadMonitorRegistry(fresh, DEFAULT_CADENCE);
      expect(result).toEqual({ monitors: [], errors: [] });
    } finally {
      await fs.rm(fresh, { recursive: true, force: true });
    }
  });
});
