import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import {
  loadRecursiveFinalOutput,
  loadRecursiveIteration,
  loadRecursiveWorkingMemory
} from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive typed execution integration", () => {
  it("executes a typed bundle, persists the iteration, and finalizes output", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-typed-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    const result = await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "typed-basic.json")
    });
    const [iteration, memory, output] = await Promise.all([
      loadRecursiveIteration(workspaceRoot, planned.session.sessionId, result.iteration.iterationId),
      loadRecursiveWorkingMemory(workspaceRoot, planned.session.sessionId),
      loadRecursiveFinalOutput(workspaceRoot, planned.session.sessionId)
    ]);

    expect(iteration?.operationsExecuted).toContain("checkpoint");
    expect(memory?.confirmedFacts).toContain("repo map inspected");
    expect(output?.summary).toBe("Typed RLM execution completed.");
  });

});
