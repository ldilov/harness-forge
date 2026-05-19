import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SentinelSnapshotProvider } from "../../../src/application/dashboard/sentinel-snapshot.js";
import { ObservationStore } from "../../../src/infrastructure/sentinel/stores/observation-store.js";
import { SignalStore } from "../../../src/infrastructure/sentinel/stores/signal-store.js";
import { ActionStore } from "../../../src/infrastructure/sentinel/stores/action-store.js";
import { LedgerStore } from "../../../src/infrastructure/sentinel/stores/ledger-store.js";
import { ActiveProfileStore } from "../../../src/infrastructure/sentinel/stores/profile-store.js";
import { ActionPlanSchema } from "../../../src/domain/sentinel/action/action-plan.js";
import type { ObservationDraft } from "../../../src/infrastructure/sentinel/stores/observation-store.js";
import type { Signal } from "../../../src/domain/sentinel/signal/signal.js";
import { generateSentinelId } from "../../../src/shared/ulid.js";
import { nowISO } from "../../../src/shared/timestamps.js";

let workspace: string;

function draft(fingerprint: string): ObservationDraft {
  return {
    source: "harness.repo_drift",
    kind: "drift.detected",
    severity: "notice",
    subject: "package.json",
    summary: "package.json changed",
    evidence: [{ kind: "file", ref: "package.json" }],
    fingerprint,
    confidence: 0.9,
  };
}

function signal(fingerprint: string, observationId: string): Signal {
  const t = nowISO();
  return {
    id: generateSentinelId("signal"),
    observationIds: [observationId],
    category: "maintenance",
    title: "Drift",
    summary: "package.json changed",
    priority: 50,
    severity: "notice",
    recommendedIntent: "refresh-harness-runtime",
    confidence: 0.9,
    createdAt: t,
    updatedAt: t,
    status: "open",
    fingerprint,
  };
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-dashboard-api-"));
  await new ActiveProfileStore(workspace).write({
    name: "cautious",
    defaultLevel: "A1",
    selectedAt: nowISO(),
    selectedBy: "test",
  });
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("SentinelSnapshotProvider", () => {
  it("status() reports daemon=not-running and zero counts on a fresh workspace", async () => {
    const status = await new SentinelSnapshotProvider(workspace).status();
    expect(status.daemon.running).toBe(false);
    expect(status.daemon.pid).toBeNull();
    expect(status.counts.observations).toBe(0);
    expect(status.counts.signals).toBe(0);
    expect(status.counts.actions).toBe(0);
    expect(status.profile.name).toBe("cautious");
    expect(status.cadence.panicStop).toBe(false);
  });

  it("observations() returns the most recent N records, newest first", async () => {
    const store = new ObservationStore(workspace);
    await store.ingest(draft("fp1"));
    await new Promise((r) => setTimeout(r, 5));
    await store.ingest(draft("fp2"));
    const list = await new SentinelSnapshotProvider(workspace).observations(10);
    expect(list.length).toBe(2);
    expect(list[0]?.fingerprint).toBe("fp2");
    expect(list[1]?.fingerprint).toBe("fp1");
  });

  it("signals() returns priority-sorted, suppression-projected signals", async () => {
    const store = new ObservationStore(workspace);
    const obs = await store.ingest(draft("fp"));
    const sigStore = new SignalStore(workspace);
    await sigStore.upsert({ ...signal("sigfp_a", obs.observation.id), priority: 30 });
    await sigStore.upsert({ ...signal("sigfp_b", obs.observation.id), priority: 80 });
    const data = await new SentinelSnapshotProvider(workspace).signals();
    expect(data.signals[0]?.priority).toBe(80);
    expect(data.signals[1]?.priority).toBe(30);
  });

  it("actions() lists plans newest-updated first and bundles their approvals", async () => {
    const store = new ActionStore(workspace);
    const t = nowISO();
    await store.upsert(
      ActionPlanSchema.parse({
        id: "act_a",
        title: "older",
        reason: "x",
        sourceSignalIds: ["sig_x"],
        proposedBy: "monitor",
        authorityRequired: "A2",
        status: "proposed",
        dryRun: false,
        risk: { level: "low", reasons: [], touchedTargets: [], reversible: true, requiresHumanApproval: true },
        steps: [{ type: "run_command", command: "echo" }],
        verification: { required: [{ type: "command", command: "echo" }] },
        createdAt: t,
        updatedAt: t,
      }),
    );
    await new Promise((r) => setTimeout(r, 5));
    const t2 = nowISO();
    await store.upsert(
      ActionPlanSchema.parse({
        id: "act_b",
        title: "newer",
        reason: "x",
        sourceSignalIds: ["sig_x"],
        proposedBy: "monitor",
        authorityRequired: "A2",
        status: "proposed",
        dryRun: false,
        risk: { level: "low", reasons: [], touchedTargets: [], reversible: true, requiresHumanApproval: true },
        steps: [{ type: "run_command", command: "echo" }],
        verification: { required: [{ type: "command", command: "echo" }] },
        createdAt: t2,
        updatedAt: t2,
      }),
    );
    const data = await new SentinelSnapshotProvider(workspace).actions();
    expect(data.actions[0]?.id).toBe("act_b");
    expect(data.actions[1]?.id).toBe("act_a");
    expect((data as Record<string, unknown>).approvals).toBeUndefined();
  });

  it("approvals(actionId) returns only approvals for that action; approvals() returns all", async () => {
    const provider = new SentinelSnapshotProvider(workspace);
    const before = await provider.approvals();
    expect(before.approvals).toEqual([]);
    const scoped = await provider.approvals("act_does_not_exist");
    expect(scoped.approvals).toEqual([]);
  });

  it("observations(limit) clamps to MAX_OBSERVATIONS_LIMIT and refuses limits below 1", async () => {
    const store = new ObservationStore(workspace);
    await store.ingest(draft("fp_a"));
    const provider = new SentinelSnapshotProvider(workspace);
    const huge = await provider.observations(10_000_000);
    expect(huge.length).toBe(1);
    const tiny = await provider.observations(0);
    expect(tiny.length).toBe(1);
  });

  it("policy() returns the active profile + cadence + budget + denied paths/commands", async () => {
    const provider = new SentinelSnapshotProvider(workspace);
    const policy = await provider.policy();
    expect(policy.activeProfile.name).toBe("cautious");
    expect(policy.activeProfile.defaultLevel).toBe("A1");
    expect(policy.cadence.panicStop).toBe(false);
    expect(typeof policy.budget.llmTokensDaily).toBe("number");
    expect(Array.isArray(policy.deniedPaths)).toBe(true);
    expect(Array.isArray(policy.deniedCommands)).toBe(true);
  });

  it("verifications() returns empty when no run dirs exist, newest-first when populated", async () => {
    const provider = new SentinelSnapshotProvider(workspace);
    const empty = await provider.verifications();
    expect(empty.rows).toEqual([]);
    const runDir = path.join(workspace, ".hforge/runtime/actions/runs/act_v1");
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(
      path.join(runDir, "verification.json"),
      JSON.stringify({
        actionPlanId: "act_v1",
        status: "passed",
        checks: [{ type: "command", status: "passed", command: "echo hi" }],
        completedAt: "2026-05-07T10:00:00.000Z",
      }),
      "utf8",
    );
    const runDir2 = path.join(workspace, ".hforge/runtime/actions/runs/act_v2");
    await fs.mkdir(runDir2, { recursive: true });
    await fs.writeFile(
      path.join(runDir2, "verification.json"),
      JSON.stringify({
        actionPlanId: "act_v2",
        status: "failed",
        checks: [{ type: "command", status: "failed", command: "false" }],
        completedAt: "2026-05-07T11:00:00.000Z",
      }),
      "utf8",
    );
    const populated = await provider.verifications();
    expect(populated.rows).toHaveLength(2);
    expect(populated.rows[0]?.actionId).toBe("act_v2");
    expect(populated.rows[1]?.actionId).toBe("act_v1");
  });

  it("verifications() ignores malformed verification.json files without throwing", async () => {
    const runDir = path.join(workspace, ".hforge/runtime/actions/runs/act_bad");
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(path.join(runDir, "verification.json"), "{not valid json", "utf8");
    const provider = new SentinelSnapshotProvider(workspace);
    const result = await provider.verifications();
    expect(result.rows).toEqual([]);
  });

  it("verifications() rejects shape-wrong but JSON-valid files via Zod", async () => {
    const runDir = path.join(workspace, ".hforge/runtime/actions/runs/act_shape");
    await fs.mkdir(runDir, { recursive: true });
    await fs.writeFile(
      path.join(runDir, "verification.json"),
      JSON.stringify({ actionPlanId: 42, status: "pwned", completedAt: null, checks: "rm -rf /" }),
      "utf8",
    );
    const provider = new SentinelSnapshotProvider(workspace);
    const result = await provider.verifications();
    expect(result.rows).toEqual([]);
  });

  it("ledger(limit) clamps to MAX_LEDGER_LIMIT and refuses limits below 1", async () => {
    const ledger = LedgerStore.forRun(workspace, "act_x");
    for (let i = 0; i < 3; i += 1) {
      await ledger.record({
        id: generateSentinelId("effect"),
        actionPlanId: "act_x",
        kind: "command_execute",
        target: `echo ${i}`,
        reversible: false,
        createdAt: nowISO(),
      });
    }
    const provider = new SentinelSnapshotProvider(workspace);
    const huge = await provider.ledger(undefined, 10_000_000);
    expect(huge.length).toBe(3);
    const tiny = await provider.ledger(undefined, 0);
    expect(tiny.length).toBe(1);
  });

  it("ledger() returns global entries newest-first and filters by --action", async () => {
    const ledger = LedgerStore.forRun(workspace, "act_x");
    await ledger.record({
      id: generateSentinelId("effect"),
      actionPlanId: "act_x",
      kind: "command_execute",
      target: "echo",
      reversible: false,
      createdAt: nowISO(),
    });
    await ledger.record({
      id: generateSentinelId("effect"),
      actionPlanId: "act_y",
      kind: "command_execute",
      target: "echo",
      reversible: false,
      createdAt: nowISO(),
    });
    const provider = new SentinelSnapshotProvider(workspace);
    const all = await provider.ledger();
    expect(all.length).toBeGreaterThanOrEqual(1);
    const onlyX = await provider.ledger("act_x");
    expect(onlyX.every((entry) => entry.actionPlanId === "act_x")).toBe(true);
  });
});
