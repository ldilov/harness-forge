import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { startDaemon } from "../../../src/application/sentinel/scheduler/daemon.js";
import { writePanicStop } from "../../../src/application/sentinel/runtime/panic-stop.js";
import { sentinelMonitorsDir, sentinelCadencePath } from "../../../src/domain/sentinel/paths.js";
import { ObservationStore } from "../../../src/infrastructure/sentinel/stores/observation-store.js";
import { readPidRecord } from "../../../src/application/sentinel/runtime/pid-file.js";

const REPO_DRIFT_YAML = `
id: repo-drift
enabled: true
source: harness.repo_drift
interval: 1s
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
  await fs.mkdir(path.dirname(sentinelCadencePath(workspace)), { recursive: true });
  await fs.writeFile(sentinelCadencePath(workspace), "globalMinIntervalSeconds: 1\n", "utf8");
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-daemon-"));
  await seed();
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("Sentinel daemon (integration)", () => {
  it("runs ticks until --max-ticks reached and writes a baseline observation", async () => {
    const handle = await startDaemon({
      workspaceRoot: workspace,
      tickIntervalMs: 100,
      stopWhen: (() => {
        let count = 0;
        return () => {
          count += 1;
          return count >= 3;
        };
      })(),
    });
    const reason = await handle.waitForExit();
    expect(reason).toBe("stopped");
    const obs = await new ObservationStore(workspace).readAll();
    expect(obs.length).toBeGreaterThan(0);
    expect(await readPidRecord(workspace)).toBeNull();
  }, 15_000);

  it("exits with reason=panic_stop when panicStop is flipped on", async () => {
    let stopFlag = false;
    const handle = await startDaemon({
      workspaceRoot: workspace,
      tickIntervalMs: 100,
      stopWhen: () => stopFlag,
    });
    setTimeout(() => {
      void writePanicStop(workspace, true);
    }, 250);
    const reason = await handle.waitForExit();
    stopFlag = true;
    expect(reason).toBe("panic_stop");
    expect(await readPidRecord(workspace)).toBeNull();
  }, 15_000);

  it("returns reason=no_monitors and releases the pid lock when the registry is empty", async () => {
    await fs.rm(sentinelMonitorsDir(workspace), { recursive: true, force: true });
    const handle = await startDaemon({
      workspaceRoot: workspace,
      tickIntervalMs: 100,
    });
    const reason = await handle.waitForExit();
    expect(reason).toBe("no_monitors");
    expect(await readPidRecord(workspace)).toBeNull();
  }, 5_000);

  it("records a cadence-ledger panic.toggle entry even when no runs are in flight", async () => {
    let stopFlag = false;
    const handle = await startDaemon({
      workspaceRoot: workspace,
      tickIntervalMs: 100,
      stopWhen: () => stopFlag,
    });
    setTimeout(() => {
      void writePanicStop(workspace, true);
    }, 250);
    await handle.waitForExit();
    stopFlag = true;
    const ledgerPath = path.join(workspace, ".hforge/runtime/cadence-ledger.jsonl");
    const raw = await fs.readFile(ledgerPath, "utf8");
    expect(raw).toContain('"kind":"panic.toggle"');
    expect(raw).toContain('"halted":true');
  }, 15_000);

  it("operator stop() call halts the loop cleanly", async () => {
    const handle = await startDaemon({
      workspaceRoot: workspace,
      tickIntervalMs: 100,
    });
    setTimeout(() => {
      void handle.stop("test-stop");
    }, 200);
    const reason = await handle.waitForExit();
    expect(reason).toBe("stopped");
  }, 5_000);
});
