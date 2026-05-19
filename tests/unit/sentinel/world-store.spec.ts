import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  WorldCache,
  WorldCursorsStore,
  WorldSourcesStore,
  safeWorldCacheKey,
} from "../../../src/infrastructure/sentinel/stores/world-store.js";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-world-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("WorldSourcesStore", () => {
  it("returns defaults on first read", async () => {
    const store = new WorldSourcesStore(workspace);
    const file = await store.read();
    expect(file.enabled).toBe(true);
    expect(file.watch.npm).toEqual([]);
  });

  it("addWatch is idempotent (added=false on duplicate)", async () => {
    const store = new WorldSourcesStore(workspace);
    const first = await store.addWatch({ kind: "npm", name: "vitest" });
    const second = await store.addWatch({ kind: "npm", name: "vitest" });
    expect(first.added).toBe(true);
    expect(second.added).toBe(false);
    expect(first.sources.watch.npm).toEqual(["vitest"]);
  });

  it("addWatch keeps the per-kind list sorted", async () => {
    const store = new WorldSourcesStore(workspace);
    await store.addWatch({ kind: "npm", name: "zod" });
    await store.addWatch({ kind: "npm", name: "vitest" });
    await store.addWatch({ kind: "npm", name: "commander" });
    const file = await store.read();
    expect(file.watch.npm).toEqual(["commander", "vitest", "zod"]);
  });

  it("removeWatch reports removed=false when the entry was not present", async () => {
    const store = new WorldSourcesStore(workspace);
    const result = await store.removeWatch({ kind: "npm", name: "ghost" });
    expect(result.removed).toBe(false);
  });

  it("does not store kinds for which no adapter slot exists (security/custom)", async () => {
    const store = new WorldSourcesStore(workspace);
    const result = await store.addWatch({ kind: "security", name: "ghsa-XXXX" });
    expect(result.added).toBe(false);
  });
});

describe("WorldCursorsStore", () => {
  it("returns null for an unset cursor", async () => {
    const store = new WorldCursorsStore(workspace);
    expect(await store.get({ kind: "npm", name: "vitest" })).toBeNull();
  });

  it("set + get round-trips", async () => {
    const store = new WorldCursorsStore(workspace);
    await store.set({ kind: "npm", name: "vitest" }, "1.0.0");
    expect(await store.get({ kind: "npm", name: "vitest" })).toBe("1.0.0");
  });
});

describe("safeWorldCacheKey", () => {
  it("preserves alphanumerics, dots, dashes, and underscores", () => {
    expect(safeWorldCacheKey("vitest")).toBe("vitest");
    expect(safeWorldCacheKey("foo.bar-baz_1")).toBe("foo.bar-baz_1");
  });

  it("replaces unsafe sequences with a single underscore", () => {
    expect(safeWorldCacheKey("@scope/pkg")).toBe("_scope_pkg");
    expect(safeWorldCacheKey("a/b\\c d")).toBe("a_b_c_d");
  });
});

describe("WorldCache", () => {
  it("write + read round-trips body and etag", async () => {
    const cache = new WorldCache(workspace, "npm");
    await cache.write("vitest", '{"x":1}', '"abc"');
    const read = await cache.read("vitest");
    expect(read?.body).toBe('{"x":1}');
    expect(read?.etag).toBe('"abc"');
  });

  it("returns null when the entry is absent", async () => {
    const cache = new WorldCache(workspace, "npm");
    expect(await cache.read("nope")).toBeNull();
  });
});
