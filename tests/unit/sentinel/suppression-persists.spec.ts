import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SignalCorrelator } from "../../../src/application/sentinel/classifier/correlator.js";
import {
  SignalStore,
  SuppressionStore,
} from "../../../src/infrastructure/sentinel/stores/signal-store.js";
import { ActionPlanner } from "../../../src/application/sentinel/action-planner/planner.js";
import { ActionStore } from "../../../src/infrastructure/sentinel/stores/action-store.js";
import type { Observation } from "../../../src/domain/sentinel/observation/observation.js";
import { generateSentinelId } from "../../../src/shared/ulid.js";
import { nowISO } from "../../../src/shared/timestamps.js";

let workspace: string;

function observation(): Observation {
  const now = nowISO();
  return {
    id: generateSentinelId("observation"),
    source: "harness.repo_drift",
    kind: "drift.detected",
    severity: "notice",
    subject: "Drift in 1 surface",
    summary: "Changed: package.json",
    evidence: [{ kind: "file", ref: "package.json" }],
    detectedAt: now,
    fingerprint: "fp-shared",
    confidence: 0.9,
    occurrenceCount: 1,
    firstSeenAt: now,
    lastSeenAt: now,
  };
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-suppress-persist-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("suppression survives re-correlation (I3 regression)", () => {
  it("re-upserting a previously-suppressed signal preserves status=suppressed and original createdAt", async () => {
    const store = new SignalStore(workspace);
    const correlator = new SignalCorrelator(store);
    const planner = new ActionPlanner(new ActionStore(workspace));

    const first = await correlator.correlate([observation()]);
    expect(first.created).toHaveLength(1);
    const initial = first.created[0]!;
    const initialCreatedAt = initial.createdAt;

    await store.upsert({ ...initial, status: "suppressed", updatedAt: nowISO() });

    await new Promise((r) => setTimeout(r, 5));
    const second = await correlator.correlate([observation()]);
    expect(second.created).toEqual([]);
    expect(second.updated).toHaveLength(1);
    const after = second.updated[0]!;
    expect(after.status).toBe("suppressed");
    expect(after.createdAt).toBe(initialCreatedAt);
    const proposed = await planner.proposeFromSignal(after);
    expect(proposed).toBeNull();
  });
});
