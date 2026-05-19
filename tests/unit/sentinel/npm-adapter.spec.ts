import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { NpmSourceAdapter } from "../../../src/infrastructure/sentinel/world/adapters/npm-source.js";
import { WorldCache } from "../../../src/infrastructure/sentinel/stores/world-store.js";
import type { PolicyFetchOptions, PolicyFetchResult } from "../../../src/infrastructure/sentinel/world/policy-fetch.js";

let workspace: string;

function makeFakeFetch(body: object): (options: PolicyFetchOptions) => Promise<PolicyFetchResult> {
  return async (_options: PolicyFetchOptions) => ({
    status: 200,
    notModified: false,
    body: JSON.stringify(body),
    etag: '"v1"',
    lastModified: null,
  });
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-npm-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("NpmSourceAdapter.fetchSince", () => {
  it("emits a bootstrap event on first fetch", async () => {
    const adapter = new NpmSourceAdapter({
      packageName: "vitest",
      cache: new WorldCache(workspace, "npm"),
      fetchImpl: makeFakeFetch({
        name: "vitest",
        "dist-tags": { latest: "3.0.0" },
        time: { "3.0.0": "2026-01-01T00:00:00.000Z" },
      }),
    });
    const result = await adapter.fetchSince({ cursor: null, maxEvents: 5, userAgent: "test/0" });
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.kind).toBe("npm.bootstrap");
    expect(result.events[0]?.version).toBe("3.0.0");
    expect(result.nextCursor).toBe("3.0.0");
  });

  it("emits a release event with majorBump=true when major version increases", async () => {
    const adapter = new NpmSourceAdapter({
      packageName: "vitest",
      cache: new WorldCache(workspace, "npm"),
      fetchImpl: makeFakeFetch({
        name: "vitest",
        "dist-tags": { latest: "4.0.0" },
        time: { "4.0.0": "2026-02-01T00:00:00.000Z", "3.0.0": "2026-01-01T00:00:00.000Z" },
      }),
    });
    const result = await adapter.fetchSince({ cursor: "3.0.0", maxEvents: 5, userAgent: "test/0" });
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.kind).toBe("npm.release");
    const raw = result.events[0]?.raw as { readonly majorBump?: boolean };
    expect(raw.majorBump).toBe(true);
  });

  it("emits no events when the version is unchanged", async () => {
    const adapter = new NpmSourceAdapter({
      packageName: "vitest",
      cache: new WorldCache(workspace, "npm"),
      fetchImpl: makeFakeFetch({
        name: "vitest",
        "dist-tags": { latest: "3.0.0" },
        time: { "3.0.0": "2026-01-01T00:00:00.000Z" },
      }),
    });
    const result = await adapter.fetchSince({ cursor: "3.0.0", maxEvents: 5, userAgent: "test/0" });
    expect(result.events).toEqual([]);
  });

  it("normalize() produces an ObservationDraft with the npm fingerprint and url evidence", async () => {
    const adapter = new NpmSourceAdapter({
      packageName: "typescript",
      cache: new WorldCache(workspace, "npm"),
      fetchImpl: makeFakeFetch({
        name: "typescript",
        "dist-tags": { latest: "5.0.0" },
        time: { "5.0.0": "2026-03-01T00:00:00.000Z" },
      }),
    });
    const fetched = await adapter.fetchSince({ cursor: null, maxEvents: 5, userAgent: "test/0" });
    const draft = adapter.normalize(fetched.events[0]!);
    expect(draft.subject).toBe("typescript");
    expect(draft.evidence[0]?.kind).toBe("url");
    expect(draft.fingerprint).toHaveLength(16);
  });

  it("returns notModified short-circuit when the registry sends 304", async () => {
    const cache = new WorldCache(workspace, "npm");
    await cache.write("vitest", JSON.stringify({}), '"v1"');
    const fakeFetch: (options: PolicyFetchOptions) => Promise<PolicyFetchResult> = async () => ({
      status: 304,
      notModified: true,
      body: "",
      etag: '"v1"',
      lastModified: null,
    });
    const adapter = new NpmSourceAdapter({
      packageName: "vitest",
      cache,
      fetchImpl: fakeFetch,
    });
    const result = await adapter.fetchSince({ cursor: "3.0.0", maxEvents: 5, userAgent: "test/0" });
    expect(result.fromCache).toBe(true);
    expect(result.events).toEqual([]);
  });
});
