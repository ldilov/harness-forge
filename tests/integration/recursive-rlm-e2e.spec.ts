import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { replayRecursiveSession } from "../../src/application/recursive/replay-session.js";
import { scoreRecursiveTrajectory } from "../../src/application/recursive/score-trajectory.js";
import {
  loadRecursiveFinalOutput,
  loadRecursiveIteration,
  loadRecursiveScorecard,
  loadRecursiveSession,
  loadRecursiveSessionSummary,
  loadRecursiveWorkingMemory,
  resolveRecursiveSessionPaths
} from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive rlm end-to-end integration", () => {
  it("plans, executes, scores, and replays one typed recursive session with durable artifacts", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-e2e-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    const executed = await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "typed-basic.json")
    });
    const scored = await scoreRecursiveTrajectory(workspaceRoot, planned.session.sessionId);
    const replay = await replayRecursiveSession(workspaceRoot, planned.session.sessionId);
    const paths = resolveRecursiveSessionPaths(workspaceRoot, planned.session.sessionId);

    const [session, summary, iteration, memory, output, scorecard, rootFrameRaw, iterationBundleRaw, checkpointFiles] =
      await Promise.all([
        loadRecursiveSession(workspaceRoot, planned.session.sessionId),
        loadRecursiveSessionSummary(workspaceRoot, planned.session.sessionId),
        loadRecursiveIteration(workspaceRoot, planned.session.sessionId, executed.iteration.iterationId),
        loadRecursiveWorkingMemory(workspaceRoot, planned.session.sessionId),
        loadRecursiveFinalOutput(workspaceRoot, planned.session.sessionId),
        loadRecursiveScorecard(workspaceRoot, planned.session.sessionId),
        fs.readFile(paths.rootFramePath, "utf8"),
        fs.readFile(
          paths.iterationsDir + `/${executed.iteration.iterationId}/bundle.json`,
          "utf8"
        ),
        fs.readdir(paths.checkpointsDir)
      ]);

    expect(session?.status).toBe("finalized");
    expect(summary?.outcome).toBe("completed");
    expect(iteration?.status).toBe("success");
    expect(memory?.confirmedFacts).toContain("repo map inspected");
    expect(output?.summary).toBe("Typed RLM execution completed.");
    expect(scorecard?.scorecardId).toBe(scored.scorecardId);
    expect(rootFrameRaw).toContain("\"allowedOperations\"");
    expect(iterationBundleRaw).toContain("\"finalize-output\"");
    expect(checkpointFiles.length).toBeGreaterThan(0);
    expect(replay.events.some((event) => event.kind === "iteration")).toBe(true);
    expect(replay.events.some((event) => event.kind === "checkpoint")).toBe(true);
  });
});
