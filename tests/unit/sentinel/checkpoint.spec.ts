import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  CheckpointStore,
  isTerminalPhase,
  recoverInflightRuns,
} from "../../../src/application/sentinel/safe-executor/checkpoint.js";
import { ActionStore } from "../../../src/infrastructure/sentinel/stores/action-store.js";
import { ActionPlanSchema, type ActionPlan } from "../../../src/domain/sentinel/action/action-plan.js";
import { sentinelRunDir } from "../../../src/domain/sentinel/paths.js";
import { nowISO } from "../../../src/shared/timestamps.js";

let workspace: string;

function makePlan(id: string): ActionPlan {
  const now = nowISO();
  return ActionPlanSchema.parse({
    id,
    title: "test",
    reason: "test",
    sourceSignalIds: ["sig_x"],
    proposedBy: "user",
    authorityRequired: "A2",
    status: "running",
    dryRun: false,
    risk: { level: "low", reasons: [], touchedTargets: [], reversible: true, requiresHumanApproval: true },
    steps: [{ type: "run_command", command: "echo" }],
    verification: { required: [{ type: "command", command: "echo" }] },
    createdAt: now,
    updatedAt: now,
  });
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-checkpoint-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("CheckpointStore", () => {
  it("write+read round-trips with the current pid and an updatedAt timestamp", async () => {
    const store = new CheckpointStore(workspace, "act_x");
    await store.write({
      actionId: "act_x",
      phase: "running",
      stepIndex: 0,
      pid: process.pid,
      hostname: os.hostname(),
      branch: "sentinel/abcd",
    });
    const result = await store.read();
    expect(result?.actionId).toBe("act_x");
    expect(result?.phase).toBe("running");
    expect(typeof result?.updatedAt).toBe("string");
  });

  it("clear() leaves the store in an empty state", async () => {
    const store = new CheckpointStore(workspace, "act_x");
    await store.write({
      actionId: "act_x",
      phase: "running",
      stepIndex: 0,
      pid: process.pid,
      hostname: os.hostname(),
      branch: null,
    });
    await store.clear();
    expect(await store.read()).toBeNull();
  });
});

describe("isTerminalPhase", () => {
  it("returns true for completed/failed/reverted only", () => {
    expect(isTerminalPhase("completed")).toBe(true);
    expect(isTerminalPhase("failed")).toBe(true);
    expect(isTerminalPhase("reverted")).toBe(true);
    expect(isTerminalPhase("running")).toBe(false);
    expect(isTerminalPhase("verifying")).toBe(false);
  });
});

describe("recoverInflightRuns", () => {
  it("flips orphan runs (non-terminal phase) to failed and records reason", async () => {
    const store = new ActionStore(workspace);
    const plan = makePlan("act_orphan");
    await store.upsert(plan);
    const checkpoint = new CheckpointStore(workspace, plan.id);
    await checkpoint.write({
      actionId: plan.id,
      phase: "running",
      stepIndex: 1,
      pid: 999_999_999,
      hostname: "previous-daemon",
      branch: "sentinel/abc123",
    });
    const result = await recoverInflightRuns(workspace);
    expect(result.orphanedRuns).toHaveLength(1);
    expect(result.orphanedRuns[0]?.actionId).toBe(plan.id);
    const refreshed = await store.findById(plan.id);
    expect(refreshed?.status).toBe("failed");
  });

  it("preserves the original phase + pid + hostname under recoveredFromPhase fields on disk", async () => {
    const store = new ActionStore(workspace);
    const plan = makePlan("act_audit");
    await store.upsert(plan);
    const checkpoint = new CheckpointStore(workspace, plan.id);
    await checkpoint.write({
      actionId: plan.id,
      phase: "verifying",
      stepIndex: null,
      pid: 4242,
      hostname: "machine-x",
      branch: "sentinel/audit",
    });
    await recoverInflightRuns(workspace);
    const after = await checkpoint.read();
    expect(after?.phase).toBe("failed");
    expect(after?.recoveredFromPhase).toBe("verifying");
    expect(after?.recoveredFromPid).toBe(4242);
    expect(after?.recoveredFromHostname).toBe("machine-x");
    expect(typeof after?.recoveredAt).toBe("string");
  });

  it("ignores runs whose checkpoint is already terminal", async () => {
    const store = new ActionStore(workspace);
    const plan = makePlan("act_done");
    await store.upsert(plan);
    const checkpoint = new CheckpointStore(workspace, plan.id);
    await checkpoint.write({
      actionId: plan.id,
      phase: "completed",
      stepIndex: null,
      pid: process.pid,
      hostname: os.hostname(),
      branch: null,
    });
    const result = await recoverInflightRuns(workspace);
    expect(result.orphanedRuns).toEqual([]);
  });

  it("returns empty when no run dirs exist", async () => {
    const result = await recoverInflightRuns(workspace);
    expect(result.orphanedRuns).toEqual([]);
    expect(result.errors).toEqual([]);
    void sentinelRunDir;
  });
});
