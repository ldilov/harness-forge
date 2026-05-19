import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SuppressionFilter } from "../../../src/application/sentinel/classifier/suppressor.js";
import { SuppressionStore } from "../../../src/infrastructure/sentinel/stores/signal-store.js";
import type { Signal } from "../../../src/domain/sentinel/signal/signal.js";

let workspace: string;

function signal(id: string, status: Signal["status"] = "open"): Signal {
  const now = new Date().toISOString();
  return {
    id,
    observationIds: ["obs_x"],
    category: "maintenance",
    title: "x",
    summary: "x",
    priority: 50,
    severity: "notice",
    confidence: 0.5,
    createdAt: now,
    updatedAt: now,
    status,
    fingerprint: `fp-${id}`,
  };
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-suppfilter-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("SuppressionFilter.apply", () => {
  it("flips matching signals to suppressed when an active suppression exists", async () => {
    const suppressions = new SuppressionStore(workspace);
    await suppressions.add({
      signalId: "sig_one",
      reason: "noisy",
      actor: "tester",
      suppressedAt: new Date().toISOString(),
      expiresAt: null,
    });
    const filter = new SuppressionFilter(suppressions);
    const result = await filter.apply([signal("sig_one"), signal("sig_two")]);
    expect(result[0]?.status).toBe("suppressed");
    expect(result[1]?.status).toBe("open");
  });

  it("ignores expired suppressions", async () => {
    const suppressions = new SuppressionStore(workspace);
    const past = new Date(Date.now() - 60_000).toISOString();
    await suppressions.add({
      signalId: "sig_one",
      reason: "old",
      actor: "tester",
      suppressedAt: past,
      expiresAt: past,
    });
    const filter = new SuppressionFilter(suppressions);
    const result = await filter.apply([signal("sig_one")]);
    expect(result[0]?.status).toBe("open");
  });
});
