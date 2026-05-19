import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  BudgetGuard,
  DEFAULT_BUDGET,
  DEFAULT_CADENCE,
  loadBudgetSnapshot,
} from "../../../src/application/sentinel/budget/budget-ledger.js";
import { CadenceLedger } from "../../../src/application/sentinel/budget/cadence-ledger.js";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-budget-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("BudgetGuard.decideTokens", () => {
  it("blocks any request when default daily budget is zero", () => {
    const guard = new BudgetGuard(DEFAULT_BUDGET, DEFAULT_CADENCE);
    expect(guard.decideTokens(1, 0)).toMatchObject({
      decision: "block",
      reason: "llm_tokens_disabled",
    });
  });

  it("allows requests inside the daily window", () => {
    const guard = new BudgetGuard(
      { ...DEFAULT_BUDGET, llmTokens: { dailyBudget: 1000, perActionBudget: 0, perMonitorBudget: 0 } },
      DEFAULT_CADENCE,
    );
    expect(guard.decideTokens(200, 100)).toMatchObject({ decision: "allow" });
  });

  it("blocks when used + requested exceeds the daily window", () => {
    const guard = new BudgetGuard(
      { ...DEFAULT_BUDGET, llmTokens: { dailyBudget: 1000, perActionBudget: 0, perMonitorBudget: 0 } },
      DEFAULT_CADENCE,
    );
    expect(guard.decideTokens(950, 100)).toMatchObject({
      decision: "block",
      reason: "llm_tokens_daily_exhausted",
    });
  });
});

describe("BudgetGuard.decideAction / decideMonitorRun", () => {
  it("blocks actions over the per-hour ceiling", () => {
    const guard = new BudgetGuard(DEFAULT_BUDGET, { ...DEFAULT_CADENCE, maxActionsPerHour: 3 });
    expect(guard.decideAction(3)).toMatchObject({
      decision: "block",
      reason: "actions_per_hour_exhausted",
    });
    expect(guard.decideAction(2)).toMatchObject({ decision: "allow" });
  });

  it("blocks monitor runs over the per-hour ceiling", () => {
    const guard = new BudgetGuard(DEFAULT_BUDGET, { ...DEFAULT_CADENCE, maxMonitorRunsPerHour: 5 });
    expect(guard.decideMonitorRun(5)).toMatchObject({
      decision: "block",
      reason: "monitor_runs_per_hour_exhausted",
    });
    expect(guard.decideMonitorRun(4)).toMatchObject({ decision: "allow" });
  });
});

describe("BudgetGuard.isPanicStopped", () => {
  it("returns the cadence panic flag", () => {
    expect(new BudgetGuard(DEFAULT_BUDGET, DEFAULT_CADENCE).isPanicStopped()).toBe(false);
    expect(
      new BudgetGuard(DEFAULT_BUDGET, { ...DEFAULT_CADENCE, panicStop: true }).isPanicStopped(),
    ).toBe(true);
  });
});

describe("loadBudgetSnapshot", () => {
  it("returns defaults when no policy files are present", async () => {
    const snapshot = await loadBudgetSnapshot(workspace);
    expect(snapshot.budget.llmTokens.dailyBudget).toBe(0);
    expect(snapshot.cadence.panicStop).toBe(false);
  });
});

describe("CadenceLedger.countSince", () => {
  it("counts only entries of the matching kind within the window", async () => {
    const ledger = new CadenceLedger(workspace);
    await ledger.record({ kind: "monitor.run", subject: "a", at: new Date(Date.now() - 30_000).toISOString() });
    await ledger.record({ kind: "monitor.run", subject: "b" });
    await ledger.record({ kind: "action.proposed", subject: "c" });
    const now = Date.now();
    expect(await ledger.countSince("monitor.run", 60 * 1000, now)).toBe(2);
    expect(await ledger.countSince("monitor.run", 5 * 1000, now)).toBe(1);
    expect(await ledger.countSince("action.proposed", 60 * 1000, now)).toBe(1);
  });
});
