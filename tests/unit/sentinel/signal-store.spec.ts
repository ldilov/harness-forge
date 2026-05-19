import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  SignalStore,
  SuppressionStore,
} from "../../../src/infrastructure/sentinel/stores/signal-store.js";
import type { Signal } from "../../../src/domain/sentinel/signal/signal.js";
import { generateSentinelId } from "../../../src/shared/ulid.js";

let workspace: string;

function makeSignal(overrides: Partial<Signal> = {}): Signal {
  const now = new Date().toISOString();
  return {
    id: generateSentinelId("signal"),
    observationIds: ["obs_x"],
    category: "maintenance",
    title: "demo",
    summary: "demo summary",
    priority: 50,
    severity: "notice",
    confidence: 0.8,
    createdAt: now,
    updatedAt: now,
    status: "open",
    fingerprint: "fpA",
    ...overrides,
  };
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-sigstore-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("SignalStore.upsert", () => {
  it("creates a new signal and reports created=true", async () => {
    const store = new SignalStore(workspace);
    const result = await store.upsert(makeSignal());
    expect(result.created).toBe(true);
    const all = await store.readAll();
    expect(all).toHaveLength(1);
  });

  it("dedupes by fingerprint and reports created=false on second upsert with same fingerprint", async () => {
    const store = new SignalStore(workspace);
    const first = await store.upsert(makeSignal({ fingerprint: "fpDedup" }));
    const second = await store.upsert(makeSignal({ fingerprint: "fpDedup", title: "updated" }));
    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    const all = await store.readAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.title).toBe("updated");
  });

  it("findById and findByFingerprint return the latest record", async () => {
    const store = new SignalStore(workspace);
    const result = await store.upsert(makeSignal({ fingerprint: "fpFind" }));
    expect(await store.findById(result.signal.id)).toEqual(result.signal);
    expect(await store.findByFingerprint("fpFind")).toEqual(result.signal);
  });
});

describe("SuppressionStore", () => {
  it("add + list round-trips with expiresAt=null", async () => {
    const store = new SuppressionStore(workspace);
    await store.add({
      signalId: "sig_test",
      reason: "noisy",
      actor: "tester",
      suppressedAt: new Date().toISOString(),
      expiresAt: null,
    });
    const list = await store.list();
    expect(list["sig_test"]).toBeDefined();
  });

  it("isActive returns false for expired suppressions", () => {
    const store = new SuppressionStore(workspace);
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(
      store.isActive(
        {
          signalId: "x",
          reason: "x",
          actor: "x",
          suppressedAt: past,
          expiresAt: past,
        },
        Date.now(),
      ),
    ).toBe(false);
  });

  it("isActive returns true for forever (null expiry)", () => {
    const store = new SuppressionStore(workspace);
    expect(
      store.isActive({
        signalId: "x",
        reason: "x",
        actor: "x",
        suppressedAt: new Date().toISOString(),
        expiresAt: null,
      }),
    ).toBe(true);
  });
});
