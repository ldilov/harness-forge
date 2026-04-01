import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createRecursiveRlmSession, createRecursiveRlmWorkspace } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive rlm session integration", () => {
  it("creates environment-first session artifacts including a root frame and handle inventory", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-rlm-session-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);

    expect(await fs.readFile(planned.artifactPaths.rootFramePath, "utf8")).toContain("\"objectiveSummary\"");
    expect(await fs.readFile(planned.artifactPaths.handleInventoryPath, "utf8")).toContain("\"handleId\"");
  });

});
