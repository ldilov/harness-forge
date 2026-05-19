import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import {
  AtomicJsonStore,
  AtomicJsonStoreReadError,
} from "../../../src/infrastructure/sentinel/stores/atomic-json-store.js";
import { ActionStore } from "../../../src/infrastructure/sentinel/stores/action-store.js";
import { sentinelActionsQueuePath } from "../../../src/domain/sentinel/paths.js";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-validate-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("AtomicJsonStore.read with validator", () => {
  it("returns the validated shape on success", async () => {
    interface Counter {
      readonly value: number;
    }
    const filePath = path.join(workspace, "c.json");
    const store = new AtomicJsonStore<Counter>(
      filePath,
      () => ({ value: 0 }),
      { validate: (raw) => raw as Counter },
    );
    await store.write({ value: 7 });
    expect(await store.read()).toEqual({ value: 7 });
  });

  it("throws AtomicJsonStoreReadError on malformed JSON", async () => {
    const filePath = path.join(workspace, "broken.json");
    await fs.writeFile(filePath, "{ not valid json", "utf8");
    const store = new AtomicJsonStore<{ readonly value: number }>(filePath, () => ({ value: 0 }));
    await expect(store.read()).rejects.toBeInstanceOf(AtomicJsonStoreReadError);
  });

  it("throws AtomicJsonStoreReadError when validator rejects the parsed value", async () => {
    const filePath = path.join(workspace, "wrong-shape.json");
    await fs.writeFile(filePath, '{"unexpected":true}', "utf8");
    const store = new AtomicJsonStore<{ readonly value: number }>(
      filePath,
      () => ({ value: 0 }),
      {
        validate: (raw) => {
          const obj = raw as Record<string, unknown>;
          if (typeof obj.value !== "number") {
            throw new Error("missing value");
          }
          return { value: obj.value };
        },
      },
    );
    await expect(store.read()).rejects.toBeInstanceOf(AtomicJsonStoreReadError);
  });

  it("includes the file path in the error message", async () => {
    const filePath = path.join(workspace, "named.json");
    await fs.writeFile(filePath, "not json at all", "utf8");
    const store = new AtomicJsonStore<unknown>(filePath, () => null);
    try {
      await store.read();
      expect.fail("should have thrown");
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AtomicJsonStoreReadError);
      expect((error as Error).message).toContain("named.json");
    }
  });
});

describe("ActionStore.upsert validates the inbound plan", () => {
  it("rejects an obviously malformed plan with a Zod error", async () => {
    const store = new ActionStore(workspace);
    await expect(
      store.upsert({
        id: "act_bad",
      } as unknown as never),
    ).rejects.toBeInstanceOf(ZodError);
  });

  it("rejects when sourceSignalIds is empty (boundary check, not waiting for setStatus)", async () => {
    const store = new ActionStore(workspace);
    const malformed = {
      id: "act_bad2",
      title: "x",
      reason: "x",
      sourceSignalIds: [],
      proposedBy: "monitor" as const,
      authorityRequired: "A2" as const,
      status: "proposed" as const,
      dryRun: false,
      risk: { level: "low" as const, reasons: [], touchedTargets: [], reversible: true, requiresHumanApproval: true },
      steps: [{ type: "run_command" as const, command: "x" }],
      verification: { required: [{ type: "command" as const, command: "x" }] },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as never;
    await expect(store.upsert(malformed)).rejects.toBeInstanceOf(ZodError);
  });
});

describe("ActionStore reads through validator", () => {
  it("surfaces a validation error if queue.json is corrupted on disk", async () => {
    const filePath = sentinelActionsQueuePath(workspace);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, '{"plans":"not-an-array","bySignal":{}}', "utf8");
    const store = new ActionStore(workspace);
    await expect(store.listAll()).rejects.toBeInstanceOf(AtomicJsonStoreReadError);
  });
});
