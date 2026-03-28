import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { planRecursiveTask } from "../../src/application/recursive/plan-task.js";
import { runStructuredAnalysis } from "../../src/application/recursive/run-structured-analysis.js";
import { loadRecursiveStructuredRun, loadRecursiveStructuredRunResult, resolveRecursiveSessionPaths } from "../../src/infrastructure/recursive/session-store.js";

const root = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive structured run flow integration", () => {
  it("submits one structured analysis snippet into an existing recursive session and records a durable run result", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-run-"));
    tempRoots.push(workspaceRoot);

    await fs.mkdir(path.join(workspaceRoot, ".hforge", "runtime", "repo"), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, ".hforge", "runtime", "repo", "repo-map.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), services: ["billing"], highRiskPaths: [], criticalPaths: [] }, null, 2),
      "utf8"
    );

    const planned = await planRecursiveTask({
      workspaceRoot,
      rootObjective: "Inspect billing retry ownership"
    });

    const snippetPath = path.join(root, "tests", "fixtures", "recursive-structured-analysis", "runs", "sample-snippet.mjs");
    const executed = await runStructuredAnalysis({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      submissionMode: "file",
      sourceFile: snippetPath
    });

    const sessionPaths = resolveRecursiveSessionPaths(workspaceRoot, planned.session.sessionId);
    const [storedMeta, storedResult, scratch] = await Promise.all([
      loadRecursiveStructuredRun(workspaceRoot, planned.session.sessionId, executed.meta.runId),
      loadRecursiveStructuredRunResult(workspaceRoot, planned.session.sessionId, executed.meta.runId),
      fs.readFile(path.join(sessionPaths.sessionDir, "scratch", `${executed.meta.runId}.md`), "utf8")
    ]);

    expect(executed.meta.status).toBe("success");
    expect(executed.result.outcome).toBe("success");
    expect(executed.result.findings[0]).toContain("Repo map keys");
    expect(storedMeta?.runId).toBe(executed.meta.runId);
    expect(storedResult?.runId).toBe(executed.meta.runId);
    expect(scratch).toContain("Inspected repo-map");
  });
});
