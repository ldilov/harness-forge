import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { scoreRecursiveTrajectory } from "../../src/application/recursive/score-trajectory.js";
import { loadRecursiveScorecard } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive scorecards integration", () => {
  it("generates a durable trajectory scorecard after typed execution", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-score-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "typed-basic.json")
    });

    const scorecard = await scoreRecursiveTrajectory(workspaceRoot, planned.session.sessionId);
    const stored = await loadRecursiveScorecard(workspaceRoot, planned.session.sessionId);
    expect(scorecard.sessionId).toBe(planned.session.sessionId);
    expect(stored?.scorecardId).toBe(scorecard.scorecardId);
  });

});
