import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { writeRecursiveExecutionPolicy } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive policy integration", () => {
  it("blocks code-cell execution when the active policy disallows it", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-policy-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await writeRecursiveExecutionPolicy(workspaceRoot, planned.session.sessionId, {
      ...(JSON.parse(await fs.readFile(planned.artifactPaths.executionPolicyPath, "utf8"))),
      allowCodeCells: false
    });

    await expect(
      executeRecursiveLanguageModel({
        workspaceRoot,
        sessionId: planned.session.sessionId,
        sourceFile: fixturePath("action-bundles", "code-cell.json")
      })
    ).rejects.toThrow(/does not allow recursive code cells/);
  });

});
