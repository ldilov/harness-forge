import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { loadRecursiveRootFrame } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive rlm root frame integration", () => {
  it("stores a compact frame that exposes budget and allowed operations", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-rlm-frame-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    const frame = await loadRecursiveRootFrame(workspaceRoot, planned.session.sessionId);

    expect(frame?.budgetView.remainingIterations).toBeGreaterThan(0);
    expect(frame?.allowedOperations).toContain("read-handle");
  });

});
