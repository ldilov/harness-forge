import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_CADENCE } from "../../../src/application/sentinel/budget/budget-ledger.js";
import {
  filterEnabledMonitors,
  loadMonitorRegistry,
} from "../../../src/application/sentinel/monitor-engine/registry.js";
import { MonitorRunner } from "../../../src/application/sentinel/monitor-engine/runner.js";
import { ActionStore } from "../../../src/infrastructure/sentinel/stores/action-store.js";
import { SignalStore } from "../../../src/infrastructure/sentinel/stores/signal-store.js";
import { sentinelMonitorsDir } from "../../../src/domain/sentinel/paths.js";

const REPO_DRIFT_YAML = `
id: repo-drift
enabled: true
source: harness.repo_drift
interval: 5m
network: none
classify:
  severity:
    default: notice
    manifest_changed: warning
dedupe:
  fingerprint: "drift:\${subject}:\${changes}"
`;

let workspace: string;

async function seed(): Promise<void> {
  await fs.writeFile(path.join(workspace, "package.json"), '{"name":"x","version":"0.0.0"}\n', "utf8");
  await fs.writeFile(path.join(workspace, "tsconfig.json"), "{}\n", "utf8");
  await fs.mkdir(sentinelMonitorsDir(workspace), { recursive: true });
  await fs.writeFile(path.join(sentinelMonitorsDir(workspace), "repo-drift.yaml"), REPO_DRIFT_YAML, "utf8");
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-flow-"));
  await seed();
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("watch → correlate → propose (integration)", () => {
  it("runs the full chain: drift observation → maintenance signal → refresh-harness-runtime action", async () => {
    const { monitors } = await loadMonitorRegistry(workspace, DEFAULT_CADENCE);
    const runner = new MonitorRunner({
      workspaceRoot: workspace,
      monitors: filterEnabledMonitors(monitors),
    });

    const baseline = await runner.runOnce();
    expect(baseline[0]?.observations[0]?.kind).toBe("drift.baseline");
    expect(baseline[0]?.signalsCreated).toEqual([]);
    expect(baseline[0]?.actionsProposed).toEqual([]);

    await fs.writeFile(path.join(workspace, "package.json"), '{"name":"x","version":"0.0.1"}\n', "utf8");
    const drift = await runner.runOnce();
    expect(drift[0]?.observations[0]?.kind).toBe("drift.detected");
    expect(drift[0]?.signalsCreated).toHaveLength(1);
    expect(drift[0]?.signalsCreated[0]?.category).toBe("maintenance");
    expect(drift[0]?.actionsProposed).toHaveLength(1);
    expect(drift[0]?.actionsProposed[0]?.title.toLowerCase()).toContain("refresh");

    const signals = await new SignalStore(workspace).readAll();
    expect(signals).toHaveLength(1);
    const actions = await new ActionStore(workspace).listAll();
    expect(actions).toHaveLength(1);
    expect(actions[0]?.sourceSignalIds).toEqual([signals[0]?.id]);
  });

  it("ledger records monitor.run AND action.proposed entries", async () => {
    const { monitors } = await loadMonitorRegistry(workspace, DEFAULT_CADENCE);
    const runner = new MonitorRunner({
      workspaceRoot: workspace,
      monitors: filterEnabledMonitors(monitors),
    });
    await runner.runOnce();
    await fs.writeFile(path.join(workspace, "package.json"), '{"name":"x","version":"0.0.2"}\n', "utf8");
    await runner.runOnce();
    const ledger = await fs.readFile(
      path.join(workspace, ".hforge/runtime/cadence-ledger.jsonl"),
      "utf8",
    );
    expect(ledger).toContain('"kind":"monitor.run"');
    expect(ledger).toContain('"kind":"action.proposed"');
  });
});
