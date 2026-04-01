import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { finalizeRecursiveSession } from "../../src/application/recursive/finalize-session.js";
import { loadRecursiveFinalOutput } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive finalization integration", () => {
  it("can synthesize a final output artifact from session state", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-finalize-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    const finalized = await finalizeRecursiveSession(workspaceRoot, planned.session.sessionId);
    const output = await loadRecursiveFinalOutput(workspaceRoot, planned.session.sessionId);

    expect(finalized.status).toBe("finalized");
    expect(output?.status).toBe("finalized");
  });

});
