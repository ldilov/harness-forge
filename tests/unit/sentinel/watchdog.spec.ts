import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Watchdog } from "../../../src/application/sentinel/watchdog/watchdog.js";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-watchdog-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("Watchdog", () => {
  it("registerRun creates a fresh active state", async () => {
    const dog = new Watchdog(workspace);
    const state = await dog.registerRun({ runId: "run_a" });
    expect(state.runId).toBe("run_a");
    expect(state.status).toBe("active");
    expect(state.interventionStep).toBe("observe");
    expect(state.interventionCount).toBe(0);
  });

  it("registerRun is idempotent — returns the existing state on second call", async () => {
    const dog = new Watchdog(workspace);
    const first = await dog.registerRun({ runId: "run_a" });
    const second = await dog.registerRun({ runId: "run_a" });
    expect(second.updatedAt).toBe(first.updatedAt);
  });

  it("recordIntervention escalates the step monotonically and increments the counter", async () => {
    const dog = new Watchdog(workspace);
    await dog.registerRun({ runId: "run_b" });
    const warn = await dog.recordIntervention({
      runId: "run_b",
      signal: "agent.tool_failure_repeated",
      step: "warn",
      reason: "1 failure",
      actor: "test",
    });
    expect(warn.state.interventionStep).toBe("warn");
    expect(warn.state.interventionCount).toBe(1);
    const constrain = await dog.recordIntervention({
      runId: "run_b",
      signal: "agent.tool_failure_repeated",
      step: "constrain",
      reason: "2 failures",
      actor: "test",
    });
    expect(constrain.state.interventionStep).toBe("constrain");
    expect(constrain.state.interventionCount).toBe(2);
    const accidentalDowngrade = await dog.recordIntervention({
      runId: "run_b",
      signal: "agent.tool_failure_repeated",
      step: "warn",
      reason: "another warning",
      actor: "test",
    });
    expect(accidentalDowngrade.state.interventionStep).toBe("constrain");
    expect(accidentalDowngrade.state.interventionCount).toBe(3);
  });

  it("pause flips status to paused and records pausedReason + pausedBy", async () => {
    const dog = new Watchdog(workspace);
    const result = await dog.pause({
      runId: "run_c",
      reason: "looping",
      actor: "tester",
    });
    expect(result.state.status).toBe("paused");
    expect(result.state.pausedReason).toBe("looping");
    expect(result.state.pausedBy).toBe("tester");
    expect(result.state.interventionStep).toBe("pause");
  });

  it("resume flips status back to active and clears pausedAt + pausedReason", async () => {
    const dog = new Watchdog(workspace);
    await dog.pause({ runId: "run_d", reason: "test", actor: "tester" });
    const after = await dog.resume({ runId: "run_d", actor: "tester", reason: "manual resume" });
    expect(after?.status).toBe("active");
    expect(after?.pausedAt).toBeNull();
    expect(after?.pausedReason).toBeNull();
  });

  it("resume returns null for unknown run ids", async () => {
    const dog = new Watchdog(workspace);
    expect(await dog.resume({ runId: "ghost", actor: "tester" })).toBeNull();
  });

  it("terminate sets status=terminated", async () => {
    const dog = new Watchdog(workspace);
    const result = await dog.recordIntervention({
      runId: "run_e",
      signal: "agent.budget_burn_high",
      step: "terminate",
      reason: "budget exhausted",
      actor: "tester",
    });
    expect(result.state.status).toBe("terminated");
  });

  it("explain returns the state, the per-run history, and the next escalation step", async () => {
    const dog = new Watchdog(workspace);
    await dog.recordIntervention({
      runId: "run_f",
      signal: "agent.looping",
      step: "warn",
      reason: "first",
      actor: "tester",
    });
    await dog.recordIntervention({
      runId: "run_f",
      signal: "agent.looping",
      step: "constrain",
      reason: "second",
      actor: "tester",
    });
    const result = await dog.explain("run_f");
    expect(result.state?.interventionStep).toBe("constrain");
    expect(result.history).toHaveLength(2);
    expect(result.nextStepIfEscalated).toBe("pause");
  });

  it("listRuns returns every registered run", async () => {
    const dog = new Watchdog(workspace);
    await dog.registerRun({ runId: "run_g1" });
    await dog.registerRun({ runId: "run_g2" });
    const runs = await dog.listRuns();
    expect(runs.map((r) => r.runId).sort()).toEqual(["run_g1", "run_g2"]);
  });

  it("listInterventions returns the latest entries up to the requested limit", async () => {
    const dog = new Watchdog(workspace);
    for (let i = 0; i < 5; i += 1) {
      await dog.recordIntervention({
        runId: "run_h",
        signal: "agent.tool_failure_repeated",
        step: "warn",
        reason: `n=${i}`,
        actor: "tester",
      });
    }
    const last3 = await dog.listInterventions(3);
    expect(last3).toHaveLength(3);
  });
});
