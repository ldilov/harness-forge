import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { MonitorRunner } from "../../../src/application/sentinel/monitor-engine/runner.js";
import { SourceAdapterRegistry } from "../../../src/application/sentinel/monitor-engine/source-adapter.js";
import type {
  CollectResult,
  SourceAdapter,
  SourceAdapterContext,
} from "../../../src/application/sentinel/monitor-engine/source-adapter.js";
import type { LoadedMonitor } from "../../../src/application/sentinel/monitor-engine/registry.js";
import { ObservationStore } from "../../../src/infrastructure/sentinel/stores/observation-store.js";
import { CadenceLedger } from "../../../src/application/sentinel/budget/cadence-ledger.js";
import { sentinelCadencePath } from "../../../src/domain/sentinel/paths.js";

let workspace: string;

function makeMonitor(overrides: Partial<LoadedMonitor["config"]> = {}): LoadedMonitor {
  return {
    config: {
      id: overrides.id ?? "test-monitor",
      enabled: true,
      source: overrides.source ?? "test.adapter",
      interval: "5m",
      network: "none",
      capabilities: [],
      observe: {},
      classify: { severity: { default: "notice", important: "warning" } },
      dedupe: { fingerprint: "k:${subject}" },
      actions: [],
      name: undefined,
      ...overrides,
    },
    intervalSeconds: 300,
    sourceFile: path.join(workspace, ".hforge", "monitors", "test.yaml"),
    warnings: [],
  };
}

class StubAdapter implements SourceAdapter {
  readonly id: string;
  collectCalls = 0;
  commitCalls = 0;
  collectResult: CollectResult;

  constructor(id: string, result: CollectResult) {
    this.id = id;
    this.collectResult = result;
  }

  async collect(_context: SourceAdapterContext): Promise<CollectResult> {
    this.collectCalls += 1;
    if (this.collectResult.commit !== undefined) {
      const inner = this.collectResult.commit;
      return {
        drafts: this.collectResult.drafts,
        commit: async () => {
          this.commitCalls += 1;
          await inner();
        },
      };
    }
    return this.collectResult;
  }
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-runner-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("MonitorRunner.runOnce", () => {
  it("invokes the adapter, persists observations, and runs the commit hook", async () => {
    const adapters = new SourceAdapterRegistry();
    const stub = new StubAdapter("test.adapter", {
      drafts: [
        {
          source: "test.adapter",
          kind: "drift.detected",
          severity: "info",
          subject: "x",
          summary: "y",
          evidence: [{ kind: "file", ref: "a.txt" }],
          fingerprint: "fp1",
          confidence: 1,
        },
      ],
      commit: async () => undefined,
    });
    adapters.register(stub);
    const monitor = makeMonitor();
    const runner = new MonitorRunner({ workspaceRoot: workspace, monitors: [monitor], adapters });
    const outcomes = await runner.runOnce();
    expect(outcomes).toHaveLength(1);
    expect(outcomes[0]?.observations).toHaveLength(1);
    expect(stub.commitCalls).toBe(1);
    const observations = await new ObservationStore(workspace).readAll();
    expect(observations).toHaveLength(1);
  });

  it("applies classify.severity rules using draft.classifyKey", async () => {
    const adapters = new SourceAdapterRegistry();
    adapters.register(
      new StubAdapter("test.adapter", {
        drafts: [
          {
            source: "test.adapter",
            kind: "drift.detected",
            severity: "info",
            classifyKey: "important",
            subject: "x",
            summary: "y",
            evidence: [{ kind: "file", ref: "a.txt" }],
            fingerprint: "fp-classify",
            confidence: 1,
          },
        ],
      }),
    );
    const monitor = makeMonitor();
    const runner = new MonitorRunner({ workspaceRoot: workspace, monitors: [monitor], adapters });
    const outcomes = await runner.runOnce();
    expect(outcomes[0]?.observations[0]?.severity).toBe("warning");
  });

  it("skips with no_adapter when source is unregistered", async () => {
    const adapters = new SourceAdapterRegistry();
    const monitor = makeMonitor({ source: "nope" });
    const runner = new MonitorRunner({ workspaceRoot: workspace, monitors: [monitor], adapters });
    const outcomes = await runner.runOnce();
    expect(outcomes[0]?.skipped).toBe(true);
    expect(outcomes[0]?.skipReason).toBe("no_adapter");
  });

  it("halts everything when panicStop is true", async () => {
    await fs.mkdir(path.dirname(sentinelCadencePath(workspace)), { recursive: true });
    await fs.writeFile(sentinelCadencePath(workspace), "panicStop: true\n", "utf8");
    const adapters = new SourceAdapterRegistry();
    const stub = new StubAdapter("test.adapter", { drafts: [] });
    adapters.register(stub);
    const runner = new MonitorRunner({ workspaceRoot: workspace, monitors: [makeMonitor()], adapters });
    const outcomes = await runner.runOnce();
    expect(outcomes[0]?.skipped).toBe(true);
    expect(outcomes[0]?.skipReason).toBe("panic_stop");
    expect(stub.collectCalls).toBe(0);
  });

  it("blocks with monitor_runs_per_hour_exhausted once the cadence ceiling is hit", async () => {
    await fs.mkdir(path.dirname(sentinelCadencePath(workspace)), { recursive: true });
    await fs.writeFile(sentinelCadencePath(workspace), "maxMonitorRunsPerHour: 1\n", "utf8");
    const adapters = new SourceAdapterRegistry();
    adapters.register(
      new StubAdapter("test.adapter", {
        drafts: [
          {
            source: "test.adapter",
            kind: "drift.detected",
            severity: "info",
            subject: "x",
            summary: "y",
            evidence: [{ kind: "file", ref: "a.txt" }],
            fingerprint: "fpY",
            confidence: 1,
          },
        ],
      }),
    );
    const monitor = makeMonitor();
    const runner = new MonitorRunner({ workspaceRoot: workspace, monitors: [monitor], adapters });
    const first = await runner.runOnce();
    const second = await runner.runOnce();
    expect(first[0]?.skipped).toBe(false);
    expect(second[0]?.skipped).toBe(true);
    expect(second[0]?.skipReason).toBe("monitor_runs_per_hour_exhausted");
  });

  it("records monitor.run cadence-ledger entries", async () => {
    const adapters = new SourceAdapterRegistry();
    adapters.register(new StubAdapter("test.adapter", { drafts: [] }));
    const runner = new MonitorRunner({ workspaceRoot: workspace, monitors: [makeMonitor()], adapters });
    await runner.runOnce();
    const ledger = new CadenceLedger(workspace);
    expect(await ledger.countSince("monitor.run", 60_000)).toBe(1);
  });
});
