import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  SignalCorrelator,
  isWorldObservationSource,
} from "../../../src/application/sentinel/classifier/correlator.js";
import { SignalStore } from "../../../src/infrastructure/sentinel/stores/signal-store.js";
import type { Observation } from "../../../src/domain/sentinel/observation/observation.js";
import { generateSentinelId } from "../../../src/shared/ulid.js";
import { nowISO } from "../../../src/shared/timestamps.js";

let workspace: string;

function npmObservation(): Observation {
  const now = nowISO();
  return {
    id: generateSentinelId("observation"),
    source: "npm:typescript",
    kind: "npm.release",
    severity: "notice",
    subject: "typescript",
    summary: "typescript released 5.4.0",
    evidence: [{ kind: "url", ref: "https://npmjs.com/typescript" }],
    detectedAt: now,
    fingerprint: "fp-npm",
    confidence: 0.9,
    occurrenceCount: 1,
    firstSeenAt: now,
    lastSeenAt: now,
  };
}

function runtimeObservation(): Observation {
  const now = nowISO();
  return {
    id: generateSentinelId("observation"),
    source: "runtime:nodejs:lts",
    kind: "runtime.maintenance",
    severity: "notice",
    subject: "Node.js v20",
    summary: "Node.js v20 in maintenance until 2026-04-30",
    evidence: [{ kind: "url", ref: "https://nodejs.org" }],
    detectedAt: now,
    fingerprint: "fp-runtime",
    confidence: 1,
    occurrenceCount: 1,
    firstSeenAt: now,
    lastSeenAt: now,
  };
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-world-corr-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("isWorldObservationSource", () => {
  it("returns true for npm/runtime/github source prefixes", () => {
    expect(isWorldObservationSource("npm:typescript")).toBe(true);
    expect(isWorldObservationSource("runtime:nodejs:lts")).toBe(true);
    expect(isWorldObservationSource("github:vitest-dev/vitest")).toBe(true);
  });

  it("returns false for non-world sources", () => {
    expect(isWorldObservationSource("harness.repo_drift")).toBe(false);
    expect(isWorldObservationSource("test.adapter")).toBe(false);
  });
});

describe("SignalCorrelator routing for world observations", () => {
  it("routes npm.* and runtime.* observations to category 'maintenance'", async () => {
    const correlator = new SignalCorrelator(new SignalStore(workspace));
    const npmResult = await correlator.correlate([npmObservation()]);
    expect(npmResult.created[0]?.category).toBe("maintenance");
    const runtimeResult = await correlator.correlate([runtimeObservation()]);
    expect(runtimeResult.created[0]?.category).toBe("maintenance");
  });
});
