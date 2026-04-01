import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { listRecursiveCheckpoints, loadRecursiveWorkingMemory } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive memory integration", () => {
  it("persists memory updates and checkpoints without transcript replay", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-memory-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "typed-basic.json")
    });

    const [memory, checkpoints] = await Promise.all([
      loadRecursiveWorkingMemory(workspaceRoot, planned.session.sessionId),
      listRecursiveCheckpoints(workspaceRoot, planned.session.sessionId)
    ]);

    expect(memory?.currentPlan).toEqual(["Finalize the recursive result"]);
    expect(checkpoints.length).toBeGreaterThan(0);
  });

});
