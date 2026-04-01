import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { listRecursiveSubcalls } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive subcalls integration", () => {
  it("stores durable subcall artifacts for typed child routing", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-subcalls-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "subcall.json")
    });

    const subcalls = await listRecursiveSubcalls(workspaceRoot, planned.session.sessionId);
    expect(subcalls[0]?.subcallType).toBe("inspect");
  });

});
