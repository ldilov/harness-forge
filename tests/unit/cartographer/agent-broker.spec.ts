import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { hookFingerprint } from "../../../src/domain/cartographer/broker/fingerprint.js";
import { recommendationsFor, nextActionFor } from "../../../src/domain/cartographer/broker/trigger-matrix.js";
import { autonomyAllows } from "../../../src/domain/cartographer/broker/hook-event.js";
import { dispatchHook } from "../../../src/application/cartographer/dispatch-hook.js";
import { loadAgentTriggersConfig } from "../../../src/application/cartographer/agent-triggers-config.js";
import { HookRunStore } from "../../../src/infrastructure/cartographer/hook-run-store.js";

let workspace: string;

async function seedRepo(): Promise<void> {
  await fs.mkdir(path.join(workspace, "src"), { recursive: true });
  await fs.writeFile(path.join(workspace, "package.json"), JSON.stringify({ name: "d", scripts: { test: "vitest" } }));
  await fs.writeFile(path.join(workspace, "src/a.ts"), "export const a = 1;\n");
  await fs.writeFile(path.join(workspace, "src/b.ts"), 'import { a } from "./a.js";\n');
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "carto-broker-"));
});
afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("hookFingerprint", () => {
  it("is stable across file ordering and command ordering", () => {
    const a = hookFingerprint({
      event: "files.changed",
      goal: "g",
      files: ["b.ts", "a.ts"],
      graphVersion: "v1",
      recentCommandSet: ["y", "x"],
    });
    const b = hookFingerprint({
      event: "files.changed",
      goal: "g",
      files: ["a.ts", "b.ts"],
      graphVersion: "v1",
      recentCommandSet: ["x", "y"],
    });
    expect(a).toBe(b);
  });

  it("changes when the graph version changes", () => {
    const base = { event: "task.started" as const, goal: "g", files: [], recentCommandSet: [] };
    expect(hookFingerprint({ ...base, graphVersion: "v1" })).not.toBe(
      hookFingerprint({ ...base, graphVersion: "v2" }),
    );
  });
});

describe("trigger matrix", () => {
  it("maps task.started to graph build + context compile", () => {
    const recs = recommendationsFor("task.started", { goal: "do x", files: [], command: "" });
    expect(recs.map((r) => r.command)).toEqual([
      "hforge graph build --if-stale",
      'hforge context compile --goal "do x"',
    ]);
    expect(recs.every((r) => r.requiredAutonomy === "diagnostic")).toBe(true);
  });

  it("maps files.changed to an impact analysis", () => {
    const recs = recommendationsFor("files.changed", { goal: "", files: ["src/a.ts"], command: "" });
    expect(recs[0]?.command).toContain("hforge impact --files");
    expect(recs[0]?.executor).toBe("impact");
    expect(nextActionFor("files.changed", recs.length).kind).toBe("review-impact");
  });

  it("assigns a typed executor to every recommendation", () => {
    const recs = recommendationsFor("task.started", { goal: "x", files: [], command: "" });
    expect(recs.map((r) => r.executor)).toEqual(["graph-build", "context-compile"]);
  });

  it("returns no recommendations for an unmapped event", () => {
    expect(recommendationsFor("command.started", { goal: "", files: [], command: "" })).toEqual([]);
  });
});

describe("autonomyAllows", () => {
  it("ranks levels correctly", () => {
    expect(autonomyAllows("diagnostic", "diagnostic")).toBe(true);
    expect(autonomyAllows("manual", "diagnostic")).toBe(false);
    expect(autonomyAllows("autonomous-local", "developer")).toBe(true);
  });
});

describe("loadAgentTriggersConfig", () => {
  it("defaults to enabled + diagnostic when no config file exists", async () => {
    const config = await loadAgentTriggersConfig(workspace);
    expect(config).toEqual({ enabled: true, autonomyLevel: "diagnostic", defaultJson: true });
  });

  it("reads autonomyLevel from .hforge/agent-triggers.yaml", async () => {
    await fs.mkdir(path.join(workspace, ".hforge"), { recursive: true });
    await fs.writeFile(
      path.join(workspace, ".hforge/agent-triggers.yaml"),
      "agentTriggers:\n  enabled: true\n  autonomyLevel: manual\n  defaultJson: false\n",
    );
    const config = await loadAgentTriggersConfig(workspace);
    expect(config.autonomyLevel).toBe("manual");
    expect(config.defaultJson).toBe(false);
  });
});

describe("dispatchHook", () => {
  it("recommends-only by default (dry-run) and persists the run", async () => {
    await seedRepo();
    const { run } = await dispatchHook({
      workspaceRoot: workspace,
      payload: { event: "task.started", goal: "improve a", files: [] },
    });
    expect(run.mode).toBe("dry-run");
    expect(run.recommendedCommands.length).toBe(2);
    expect(run.executedCommands).toEqual([]);
    expect(run.status).toBe("ok");
    const recent = await new HookRunStore(workspace).recent(10);
    expect(recent.map((r) => r.id)).toContain(run.id);
  });

  it("executes auto-executable diagnostic commands in-process when --execute and autonomy permits", async () => {
    await seedRepo();
    const { run } = await dispatchHook({
      workspaceRoot: workspace,
      execute: true,
      payload: { event: "task.started", goal: "improve a", files: [] },
    });
    expect(run.mode).toBe("execute");
    expect(run.executedCommands.some((c) => c.status === "ok")).toBe(true);
    expect(run.contextBundleId).toBeDefined();
  });

  it("does not execute when autonomyLevel is manual", async () => {
    await seedRepo();
    await fs.mkdir(path.join(workspace, ".hforge"), { recursive: true });
    await fs.writeFile(
      path.join(workspace, ".hforge/agent-triggers.yaml"),
      "agentTriggers:\n  enabled: true\n  autonomyLevel: manual\n  defaultJson: true\n",
    );
    const { run } = await dispatchHook({
      workspaceRoot: workspace,
      execute: true,
      payload: { event: "task.started", goal: "x", files: [] },
    });
    expect(run.mode).toBe("dry-run");
    expect(run.notes.some((n) => n.includes("does not permit execution"))).toBe(true);
  });

  it("returns a cached run on an identical request within the cooldown (loop prevention)", async () => {
    await seedRepo();
    const first = await dispatchHook({
      workspaceRoot: workspace,
      payload: { event: "task.started", goal: "same", files: [] },
    });
    const second = await dispatchHook({
      workspaceRoot: workspace,
      payload: { event: "task.started", goal: "same", files: [] },
    });
    expect(second.run.cached).toBe(true);
    expect(second.run.id).toBe(first.run.id);
    expect(second.run.notes.some((n) => n.includes("cooldown"))).toBe(true);
  });

  it("does not cache once the cooldown elapses", async () => {
    await seedRepo();
    const first = await dispatchHook({
      workspaceRoot: workspace,
      cooldownMs: 0,
      payload: { event: "task.started", goal: "same", files: [] },
    });
    const second = await dispatchHook({
      workspaceRoot: workspace,
      cooldownMs: 0,
      payload: { event: "task.started", goal: "same", files: [] },
    });
    expect(second.run.cached).toBe(false);
    expect(second.run.id).not.toBe(first.run.id);
  });
});
