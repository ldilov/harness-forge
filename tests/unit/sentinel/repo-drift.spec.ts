import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { RepoDriftSourceAdapter } from "../../../src/application/sentinel/monitor-engine/builtins/repo-drift.js";
import { MonitorConfigSchema } from "../../../src/domain/sentinel/monitor/monitor.js";
import type { LoadedMonitor } from "../../../src/application/sentinel/monitor-engine/registry.js";

let workspace: string;

async function seedRepo(): Promise<void> {
  await fs.writeFile(path.join(workspace, "package.json"), '{"name":"x","version":"0.0.0"}\n', "utf8");
  await fs.writeFile(path.join(workspace, "tsconfig.json"), "{}\n", "utf8");
}

function loadedMonitor(): LoadedMonitor {
  const config = MonitorConfigSchema.parse({
    id: "repo-drift",
    enabled: true,
    source: "harness.repo_drift",
    interval: "5m",
    dedupe: { fingerprint: "drift:${subject}:${changes}" },
  });
  return { config, intervalSeconds: 300, sourceFile: "test.yaml", warnings: [] };
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-drift-"));
  await seedRepo();
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("RepoDriftSourceAdapter", () => {
  it("emits a baseline observation on first collect and exposes a commit", async () => {
    const adapter = new RepoDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(result.drafts).toHaveLength(1);
    expect(result.drafts[0]?.kind).toBe("drift.baseline");
    expect(typeof result.commit).toBe("function");
  });

  it("does NOT persist the snapshot file unless commit() is invoked", async () => {
    const adapter = new RepoDriftSourceAdapter();
    await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    const snapshotPath = path.join(workspace, ".hforge/runtime/observations/repo-drift-snapshot.json");
    await expect(fs.access(snapshotPath)).rejects.toBeTruthy();
  });

  it("persists the snapshot only after commit() resolves", async () => {
    const adapter = new RepoDriftSourceAdapter();
    const result = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    await result.commit?.();
    const snapshotPath = path.join(workspace, ".hforge/runtime/observations/repo-drift-snapshot.json");
    await expect(fs.access(snapshotPath)).resolves.toBeUndefined();
  });

  it("emits a drift.detected observation only when an underlying file changes", async () => {
    const adapter = new RepoDriftSourceAdapter();
    const baseline = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    await baseline.commit?.();
    const noChange = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(noChange.drafts).toEqual([]);
    await fs.writeFile(path.join(workspace, "package.json"), '{"name":"x","version":"0.0.1"}\n', "utf8");
    const changed = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(changed.drafts).toHaveLength(1);
    expect(changed.drafts[0]?.kind).toBe("drift.detected");
    expect(changed.drafts[0]?.classifyKey).toBe("default");
  });

  it("flags manifest changes with classifyKey=manifest_changed", async () => {
    const adapter = new RepoDriftSourceAdapter();
    const baseline = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    await baseline.commit?.();
    await fs.mkdir(path.join(workspace, ".hforge"), { recursive: true });
    await fs.writeFile(path.join(workspace, ".hforge/agent-manifest.json"), "{}\n", "utf8");
    const changed = await adapter.collect({ workspaceRoot: workspace, monitor: loadedMonitor() });
    expect(changed.drafts[0]?.classifyKey).toBe("manifest_changed");
  });
});
