import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseRecursiveActionBundle } from "../../src/domain/recursive/action-bundle.js";

const root = process.cwd();

describe("recursive action bundle contract", () => {
  it("accepts the canonical typed bundle fixture", async () => {
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "recursive-rlm", "action-bundles", "typed-basic.json"), "utf8")
    );

    const bundle = parseRecursiveActionBundle({
      bundleId: "BUNDLE-001",
      sessionId: "RS-001",
      iterationId: "ITER-001",
      createdAt: "2026-04-01T10:00:00.000Z",
      ...fixture
    });

    expect(bundle.actions.map((action) => action.kind)).toEqual([
      "read-handle",
      "update-memory",
      "checkpoint",
      "finalize-output"
    ]);
  });

  it("rejects unsupported recursive actions", async () => {
    const fixture = JSON.parse(
      await fs.readFile(path.join(root, "tests", "fixtures", "recursive-rlm", "action-bundles", "invalid.json"), "utf8")
    );

    expect(() =>
      parseRecursiveActionBundle({
        bundleId: "BUNDLE-INVALID",
        sessionId: "RS-001",
        iterationId: "ITER-001",
        createdAt: "2026-04-01T10:00:00.000Z",
        ...fixture
      })
    ).toThrow();
  });

});
