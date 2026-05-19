import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { JsonlStore } from "../../../src/infrastructure/sentinel/stores/jsonl-store.js";

interface Sample {
  readonly id: number;
  readonly name: string;
}

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-jsonl-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("JsonlStore", () => {
  it("appends and reads records back in order", async () => {
    const store = new JsonlStore<Sample>(path.join(workspace, "out.jsonl"));
    await store.append({ id: 1, name: "a" });
    await store.append({ id: 2, name: "b" });
    const records = await store.readAll();
    expect(records).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
  });

  it("returns empty when file is missing", async () => {
    const store = new JsonlStore<Sample>(path.join(workspace, "ghost.jsonl"));
    expect(await store.readAll()).toEqual([]);
    expect(await store.count()).toBe(0);
  });

  it("supports tail()", async () => {
    const store = new JsonlStore<Sample>(path.join(workspace, "tail.jsonl"));
    for (let i = 0; i < 5; i += 1) {
      await store.append({ id: i, name: String(i) });
    }
    const tail = await store.tail(2);
    expect(tail).toEqual([
      { id: 3, name: "3" },
      { id: 4, name: "4" },
    ]);
  });

  it("appendMany batches writes correctly", async () => {
    const store = new JsonlStore<Sample>(path.join(workspace, "many.jsonl"));
    await store.appendMany([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
      { id: 3, name: "c" },
    ]);
    expect(await store.count()).toBe(3);
  });
});
