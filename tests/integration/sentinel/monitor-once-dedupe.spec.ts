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
import { ObservationStore } from "../../../src/infrastructure/sentinel/stores/observation-store.js";
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
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-it-"));
  await seed();
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("monitor once → observe (integration)", () => {
  it("baseline → no-op → drift cycle records exactly the right observations", async () => {
    const { monitors } = await loadMonitorRegistry(workspace, DEFAULT_CADENCE);
    const enabled = filterEnabledMonitors(monitors);
    const runner = new MonitorRunner({ workspaceRoot: workspace, monitors: enabled });

    const tickOne = await runner.runOnce();
    expect(tickOne[0]?.observations).toHaveLength(1);
    expect(tickOne[0]?.observations[0]?.kind).toBe("drift.baseline");

    const tickTwo = await runner.runOnce();
    expect(tickTwo[0]?.observations).toEqual([]);

    await fs.writeFile(path.join(workspace, "package.json"), '{"name":"x","version":"0.0.1"}\n', "utf8");
    const tickThree = await runner.runOnce();
    expect(tickThree[0]?.observations).toHaveLength(1);
    expect(tickThree[0]?.observations[0]?.kind).toBe("drift.detected");
    expect(tickThree[0]?.observations[0]?.severity).toBe("notice");

    const all = await new ObservationStore(workspace).readAll();
    expect(all.map((o) => o.kind).sort()).toEqual(["drift.baseline", "drift.detected"]);
  });

  it("classify rules elevate severity when the manifest changes", async () => {
    const { monitors } = await loadMonitorRegistry(workspace, DEFAULT_CADENCE);
    const runner = new MonitorRunner({
      workspaceRoot: workspace,
      monitors: filterEnabledMonitors(monitors),
    });
    await runner.runOnce();
    await fs.mkdir(path.join(workspace, ".hforge"), { recursive: true });
    await fs.writeFile(path.join(workspace, ".hforge/agent-manifest.json"), "{}\n", "utf8");
    const tick = await runner.runOnce();
    expect(tick[0]?.observations[0]?.severity).toBe("warning");
  });

  it("default budget enforces zero LLM token spend", async () => {
    const { monitors } = await loadMonitorRegistry(workspace, DEFAULT_CADENCE);
    const runner = new MonitorRunner({
      workspaceRoot: workspace,
      monitors: filterEnabledMonitors(monitors),
    });
    await runner.runOnce();
    const ledgerPath = path.join(workspace, ".hforge/runtime/cadence-ledger.jsonl");
    const ledger = await fs.readFile(ledgerPath, "utf8");
    expect(ledger).not.toContain('"kind":"llm.call"');
  });
});
