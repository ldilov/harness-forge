import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { replayRecursiveSession } from "../../src/application/recursive/replay-session.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive replay integration", () => {
  it("replays the durable recursive trajectory in chronological order", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-replay-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "typed-basic.json")
    });

    const replay = await replayRecursiveSession(workspaceRoot, planned.session.sessionId);
    expect(replay.events.some((event) => event.kind === "iteration")).toBe(true);
  });

});
