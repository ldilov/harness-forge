import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { planRecursiveTask } from "../../src/application/recursive/plan-task.js";
import { runStructuredAnalysis } from "../../src/application/recursive/run-structured-analysis.js";
import { listRecursiveStructuredRuns, loadRecursiveStructuredRunResult } from "../../src/infrastructure/recursive/session-store.js";

const root = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive run history contract", () => {
  it("lists durable structured-analysis run records for one recursive session", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-history-"));
    tempRoots.push(workspaceRoot);

    await fs.mkdir(path.join(workspaceRoot, ".hforge", "runtime", "repo"), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, ".hforge", "runtime", "repo", "repo-map.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), services: ["billing"] }, null, 2),
      "utf8"
    );

    const planned = await planRecursiveTask({ workspaceRoot, rootObjective: "Inspect durable run history" });
    const snippetPath = path.join(root, "tests", "fixtures", "recursive-structured-analysis", "runs", "sample-snippet.mjs");

    const first = await runStructuredAnalysis({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      submissionMode: "file",
      sourceFile: snippetPath
    });

    const second = await runStructuredAnalysis({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      submissionMode: "stdin",
      stdinContent: await fs.readFile(snippetPath, "utf8")
    });

    const runs = await listRecursiveStructuredRuns(workspaceRoot, planned.session.sessionId);
    expect(runs.map((run) => run.runId)).toEqual([first.meta.runId, second.meta.runId]);
  });

  it("inspects one structured-analysis run without requiring raw execution logs", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-inspect-"));
    tempRoots.push(workspaceRoot);

    await fs.mkdir(path.join(workspaceRoot, ".hforge", "runtime", "repo"), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, ".hforge", "runtime", "repo", "repo-map.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), services: ["billing"] }, null, 2),
      "utf8"
    );

    const planned = await planRecursiveTask({ workspaceRoot, rootObjective: "Inspect one durable recursive run" });
    const snippetPath = path.join(root, "tests", "fixtures", "recursive-structured-analysis", "runs", "sample-snippet.mjs");
    const executed = await runStructuredAnalysis({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      submissionMode: "file",
      sourceFile: snippetPath
    });

    const result = await loadRecursiveStructuredRunResult(workspaceRoot, planned.session.sessionId, executed.meta.runId);
    expect(result?.outcome).toBe("success");
    expect(result?.findings.length).toBeGreaterThan(0);
  });
});
