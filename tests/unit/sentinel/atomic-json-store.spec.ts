import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AtomicJsonStore } from "../../../src/infrastructure/sentinel/stores/atomic-json-store.js";

interface Counter {
  readonly value: number;
}

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-atomic-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("AtomicJsonStore", () => {
  it("returns initial when file is missing", async () => {
    const store = new AtomicJsonStore<Counter>(path.join(workspace, "c.json"), () => ({ value: 0 }));
    expect(await store.read()).toEqual({ value: 0 });
  });

  it("write+read round-trips via tmp+rename without leaving .tmp behind", async () => {
    const filePath = path.join(workspace, "c.json");
    const store = new AtomicJsonStore<Counter>(filePath, () => ({ value: 0 }));
    await store.write({ value: 7 });
    expect(await store.read()).toEqual({ value: 7 });
    const entries = await fs.readdir(workspace);
    expect(entries.filter((entry) => entry.endsWith(".tmp"))).toEqual([]);
  });

  it("serializes concurrent updates without losing increments", async () => {
    const store = new AtomicJsonStore<Counter>(path.join(workspace, "c.json"), () => ({ value: 0 }));
    const total = 50;
    await Promise.all(
      Array.from({ length: total }, () =>
        store.update((current) => ({ value: current.value + 1 })),
      ),
    );
    const final = await store.read();
    expect(final.value).toBe(total);
  });
});
