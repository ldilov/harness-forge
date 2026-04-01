import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { listRecursiveMetaOpProposals } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive meta-ops integration", () => {
  it("stores proposal-first meta-op artifacts", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-meta-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "promotion.json")
    });

    const proposals = await listRecursiveMetaOpProposals(workspaceRoot, planned.session.sessionId);
    expect(proposals[0]?.status).toBe("proposed");
  });

});
