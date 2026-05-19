import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ActionPlanner } from "../../../src/application/sentinel/action-planner/planner.js";
import { ActionStore } from "../../../src/infrastructure/sentinel/stores/action-store.js";
import type { Signal } from "../../../src/domain/sentinel/signal/signal.js";
import { generateSentinelId } from "../../../src/shared/ulid.js";

let workspace: string;

function signalFor(intent: string | undefined, status: Signal["status"] = "open"): Signal {
  const now = new Date().toISOString();
  return {
    id: generateSentinelId("signal"),
    observationIds: ["obs_x"],
    category: "maintenance",
    title: "Drift",
    summary: "package.json changed",
    priority: 60,
    severity: "notice",
    ...(intent === undefined ? {} : { recommendedIntent: intent }),
    confidence: 0.9,
    createdAt: now,
    updatedAt: now,
    status,
    fingerprint: "fp-1",
  };
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-planner-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("ActionPlanner.proposeFromSignal", () => {
  it("produces a refresh-harness-runtime action for a maintenance signal with that intent", async () => {
    const planner = new ActionPlanner(new ActionStore(workspace));
    const plan = await planner.proposeFromSignal(signalFor("refresh-harness-runtime"));
    expect(plan).not.toBeNull();
    expect(plan?.title.toLowerCase()).toContain("refresh");
    expect(plan?.authorityRequired).toBe("A2");
    expect(plan?.risk.level).toBe("low");
    expect(plan?.steps.length).toBeGreaterThan(0);
    expect(plan?.verification.required.length).toBeGreaterThan(0);
  });

  it("returns null when the signal has no recommendedIntent", async () => {
    const planner = new ActionPlanner(new ActionStore(workspace));
    const plan = await planner.proposeFromSignal(signalFor(undefined));
    expect(plan).toBeNull();
  });

  it("returns null for unknown intents", async () => {
    const planner = new ActionPlanner(new ActionStore(workspace));
    const plan = await planner.proposeFromSignal(signalFor("not-a-real-intent"));
    expect(plan).toBeNull();
  });

  it("does not duplicate when a plan already exists for the signal", async () => {
    const planner = new ActionPlanner(new ActionStore(workspace));
    const fixed = signalFor("refresh-harness-runtime");
    const first = await planner.proposeFromSignal(fixed);
    expect(first).not.toBeNull();
    const second = await planner.proposeFromSignal(fixed);
    expect(second).toBeNull();
  });

  it("skips signals whose status is not open", async () => {
    const planner = new ActionPlanner(new ActionStore(workspace));
    expect(await planner.proposeFromSignal(signalFor("refresh-harness-runtime", "suppressed"))).toBeNull();
    expect(await planner.proposeFromSignal(signalFor("refresh-harness-runtime", "resolved"))).toBeNull();
  });
});
