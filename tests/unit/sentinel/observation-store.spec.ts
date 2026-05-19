import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ObservationStore } from "../../../src/infrastructure/sentinel/stores/observation-store.js";
import type { ObservationDraft } from "../../../src/infrastructure/sentinel/stores/observation-store.js";

let workspace: string;

const baseDraft: ObservationDraft = {
  source: "test.adapter",
  kind: "drift.detected",
  severity: "notice",
  subject: "demo",
  summary: "demo summary",
  evidence: [{ kind: "file", ref: "package.json" }],
  fingerprint: "abc123",
  confidence: 0.5,
};

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-obs-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("ObservationStore.ingest", () => {
  it("creates a new record on first ingest with deduped=false", async () => {
    const store = new ObservationStore(workspace);
    const result = await store.ingest(baseDraft);
    expect(result.deduped).toBe(false);
    expect(result.occurrenceCount).toBe(1);
    expect(result.observation.id.startsWith("obs_")).toBe(true);
    const all = await store.readAll();
    expect(all).toHaveLength(1);
  });

  it("dedupes on identical fingerprint and increments occurrenceCount", async () => {
    const store = new ObservationStore(workspace);
    await store.ingest(baseDraft);
    const second = await store.ingest(baseDraft);
    const third = await store.ingest(baseDraft);
    expect(second.deduped).toBe(true);
    expect(second.occurrenceCount).toBe(2);
    expect(third.occurrenceCount).toBe(3);
    const all = await store.readAll();
    expect(all).toHaveLength(1);
  });

  it("treats different fingerprints as distinct records", async () => {
    const store = new ObservationStore(workspace);
    await store.ingest(baseDraft);
    await store.ingest({ ...baseDraft, fingerprint: "xyz789", subject: "other" });
    expect(await store.readAll()).toHaveLength(2);
  });

  it("preserves first-seen timestamp on dedupe", async () => {
    const store = new ObservationStore(workspace);
    const first = await store.ingest(baseDraft);
    await new Promise((r) => setTimeout(r, 5));
    const second = await store.ingest(baseDraft);
    expect(second.observation.firstSeenAt).toBe(first.observation.firstSeenAt);
    expect(Date.parse(second.observation.lastSeenAt!)).toBeGreaterThanOrEqual(
      Date.parse(first.observation.firstSeenAt!),
    );
  });

  it("survives serial concurrent ingests of the same fingerprint without duplicating", async () => {
    const store = new ObservationStore(workspace);
    await Promise.all([
      store.ingest(baseDraft),
      store.ingest(baseDraft),
      store.ingest(baseDraft),
    ]);
    expect(await store.readAll()).toHaveLength(1);
  });
});
