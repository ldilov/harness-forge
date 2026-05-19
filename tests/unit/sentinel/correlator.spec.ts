import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SignalCorrelator } from "../../../src/application/sentinel/classifier/correlator.js";
import { SignalStore } from "../../../src/infrastructure/sentinel/stores/signal-store.js";
import type { Observation } from "../../../src/domain/sentinel/observation/observation.js";
import { generateSentinelId } from "../../../src/shared/ulid.js";

let workspace: string;

function makeObservation(overrides: Partial<Observation> = {}): Observation {
  const now = new Date().toISOString();
  return {
    id: generateSentinelId("observation"),
    source: "harness.repo_drift",
    kind: "drift.detected",
    severity: "notice",
    subject: "Drift in 1 surface",
    summary: "Changed: package.json",
    evidence: [{ kind: "file", ref: "package.json" }],
    detectedAt: now,
    fingerprint: "fp-obs",
    confidence: 0.9,
    occurrenceCount: 1,
    firstSeenAt: now,
    lastSeenAt: now,
    ...overrides,
  };
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-correlator-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("SignalCorrelator.correlate", () => {
  it("does not produce signals for info severity", async () => {
    const correlator = new SignalCorrelator(new SignalStore(workspace));
    const result = await correlator.correlate([makeObservation({ severity: "info" })]);
    expect(result.created).toEqual([]);
    expect(result.skipped).toBe(1);
  });

  it("creates a maintenance signal for drift.* observations", async () => {
    const correlator = new SignalCorrelator(new SignalStore(workspace));
    const result = await correlator.correlate([makeObservation()]);
    expect(result.created).toHaveLength(1);
    expect(result.created[0]?.category).toBe("maintenance");
    expect(result.created[0]?.recommendedIntent).toBe("refresh-harness-runtime");
  });

  it("dedupes by category+observation-fingerprint on a second call", async () => {
    const correlator = new SignalCorrelator(new SignalStore(workspace));
    await correlator.correlate([makeObservation()]);
    const second = await correlator.correlate([makeObservation()]);
    expect(second.created).toEqual([]);
    expect(second.updated).toHaveLength(1);
  });

  it("routes agent.* kinds to agent-health and ci.* to regression", async () => {
    const correlator = new SignalCorrelator(new SignalStore(workspace));
    const agent = await correlator.correlate([
      makeObservation({ kind: "agent.looping", severity: "warning", fingerprint: "fp-agent" }),
    ]);
    expect(agent.created[0]?.category).toBe("agent-health");
    const ci = await correlator.correlate([
      makeObservation({ kind: "ci.failure", severity: "critical", fingerprint: "fp-ci" }),
    ]);
    expect(ci.created[0]?.category).toBe("regression");
  });

  it("computes a deterministic priority that sorts critical above notice", async () => {
    const correlator = new SignalCorrelator(new SignalStore(workspace));
    const noticeOnly = await correlator.correlate([makeObservation({ fingerprint: "fp-low" })]);
    const critical = await correlator.correlate([
      makeObservation({ severity: "critical", fingerprint: "fp-high" }),
    ]);
    expect(critical.created[0]?.priority).toBeGreaterThan(noticeOnly.created[0]?.priority ?? 0);
  });
});
