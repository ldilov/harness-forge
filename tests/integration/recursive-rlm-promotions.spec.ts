import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { listRecursivePromotionProposals } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive promotions integration", () => {
  it("stores proposal-first promotion artifacts", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-promo-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "promotion.json")
    });

    const promotions = await listRecursivePromotionProposals(workspaceRoot, planned.session.sessionId);
    expect(promotions[0]?.status).toBe("proposed");
  });

});
