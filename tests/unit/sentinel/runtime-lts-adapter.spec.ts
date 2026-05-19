import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { RuntimeLtsSourceAdapter } from "../../../src/infrastructure/sentinel/world/adapters/runtime-lts-source.js";
import { WorldCache } from "../../../src/infrastructure/sentinel/stores/world-store.js";
import type { PolicyFetchOptions, PolicyFetchResult } from "../../../src/infrastructure/sentinel/world/policy-fetch.js";

let workspace: string;

const SCHEDULE = {
  v18: { start: "2022-04-19", lts: "2022-10-25", maintenance: "2024-10-18", end: "2025-04-30" },
  v20: { start: "2023-04-18", lts: "2023-10-24", maintenance: "2025-10-22", end: "2026-12-31" },
  v22: { start: "2024-04-23", lts: "2024-10-29", maintenance: "2027-10-19", end: "2028-04-30" },
};

function makeFakeFetch(body: unknown): (options: PolicyFetchOptions) => Promise<PolicyFetchResult> {
  return async () => ({
    status: 200,
    notModified: false,
    body: JSON.stringify(body),
    etag: '"v1"',
    lastModified: null,
  });
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-runtime-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("RuntimeLtsSourceAdapter.fetchSince", () => {
  it("emits one event per non-EOL major", async () => {
    const adapter = new RuntimeLtsSourceAdapter({
      runtime: "nodejs:lts",
      cache: new WorldCache(workspace, "runtime"),
      fetchImpl: makeFakeFetch(SCHEDULE),
      now: () => new Date("2026-05-06"),
    });
    const result = await adapter.fetchSince({ cursor: null, maxEvents: 10, userAgent: "test/0" });
    const majors = result.events.map((event) => (event.raw as { major: string }).major).sort();
    expect(majors).toEqual(["v20", "v22"]);
  });

  it("classifies a version past 'maintenance' but before 'end' as runtime.maintenance", async () => {
    const adapter = new RuntimeLtsSourceAdapter({
      runtime: "nodejs:lts",
      cache: new WorldCache(workspace, "runtime"),
      fetchImpl: makeFakeFetch(SCHEDULE),
      now: () => new Date("2026-01-01"),
    });
    const result = await adapter.fetchSince({ cursor: null, maxEvents: 10, userAgent: "test/0" });
    const v20 = result.events.find((event) => (event.raw as { major: string }).major === "v20");
    const v22 = result.events.find((event) => (event.raw as { major: string }).major === "v22");
    expect(v20?.kind).toBe("runtime.maintenance");
    expect(v22).toBeDefined();
  });

  it("returns no events when the cursor matches the current schedule fingerprint", async () => {
    const adapter = new RuntimeLtsSourceAdapter({
      runtime: "nodejs:lts",
      cache: new WorldCache(workspace, "runtime"),
      fetchImpl: makeFakeFetch(SCHEDULE),
      now: () => new Date("2026-05-06"),
    });
    const first = await adapter.fetchSince({ cursor: null, maxEvents: 10, userAgent: "test/0" });
    const second = await adapter.fetchSince({
      cursor: first.nextCursor,
      maxEvents: 10,
      userAgent: "test/0",
    });
    expect(second.events).toEqual([]);
  });
});
