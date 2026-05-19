import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ActionStore } from "../../../src/infrastructure/sentinel/stores/action-store.js";
import {
  ActionPlanSchema,
  type ActionPlan,
} from "../../../src/domain/sentinel/action/action-plan.js";

let workspace: string;

function makePlan(overrides: Partial<ActionPlan> = {}): ActionPlan {
  const now = new Date().toISOString();
  return ActionPlanSchema.parse({
    id: overrides.id ?? "act_one",
    title: "title",
    reason: "reason",
    sourceSignalIds: overrides.sourceSignalIds ?? ["sig_one"],
    proposedBy: "monitor",
    authorityRequired: "A2",
    status: overrides.status ?? "proposed",
    dryRun: false,
    risk: {
      level: "low",
      reasons: [],
      touchedTargets: [],
      reversible: true,
      requiresHumanApproval: true,
    },
    steps: [{ type: "run_command", command: "hforge refresh" }],
    verification: { required: [{ type: "command", command: "hforge doctor" }] },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-actionstore-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("ActionStore", () => {
  it("upsert(new) reports created=true and stores the plan", async () => {
    const store = new ActionStore(workspace);
    const result = await store.upsert(makePlan());
    expect(result.created).toBe(true);
    expect(await store.findById("act_one")).not.toBeNull();
  });

  it("upsert(same id) reports created=false and replaces in place", async () => {
    const store = new ActionStore(workspace);
    await store.upsert(makePlan());
    const second = await store.upsert(makePlan({ status: "approved" }));
    expect(second.created).toBe(false);
    const all = await store.listAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.status).toBe("approved");
  });

  it("findBySignal returns the plan that cited the signal", async () => {
    const store = new ActionStore(workspace);
    await store.upsert(makePlan({ sourceSignalIds: ["sig_match"] }));
    const found = await store.findBySignal("sig_match");
    expect(found?.id).toBe("act_one");
  });

  it("setStatus updates a plan and returns the updated record", async () => {
    const store = new ActionStore(workspace);
    await store.upsert(makePlan());
    const updated = await store.setStatus("act_one", "rejected", new Date().toISOString());
    expect(updated?.status).toBe("rejected");
  });

  it("setStatus returns null for unknown id", async () => {
    const store = new ActionStore(workspace);
    expect(await store.setStatus("nope", "rejected", new Date().toISOString())).toBeNull();
  });
});
