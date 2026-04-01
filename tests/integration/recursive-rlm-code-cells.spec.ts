import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { listRecursiveCodeCells, loadRecursiveCodeCellResult } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive code cell integration", () => {
  it("runs one bounded code cell and stores its verdict", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-cells-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "code-cell.json")
    });

    const cells = await listRecursiveCodeCells(workspaceRoot, planned.session.sessionId);
    const result = await loadRecursiveCodeCellResult(workspaceRoot, planned.session.sessionId, cells[0]!.cellId);
    expect(cells[0]?.languageId).toBe("javascript");
    expect(result?.verdict).toBe("completed");
  });

});
