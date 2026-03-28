import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { planRecursiveTask } from "../../src/application/recursive/plan-task.js";
import { runStructuredAnalysis } from "../../src/application/recursive/run-structured-analysis.js";
import {
  listRecursiveStructuredRuns,
  loadRecursiveStructuredRun,
  loadRecursiveStructuredRunResult,
  resolveRecursiveSessionPaths
} from "../../src/infrastructure/recursive/session-store.js";

const root = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive structured run flow integration", () => {
  async function createPlannedSession(workspaceRoot: string) {
    await fs.mkdir(path.join(workspaceRoot, ".hforge", "runtime", "repo"), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, ".hforge", "runtime", "repo", "repo-map.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), services: ["billing"], highRiskPaths: [], criticalPaths: [] }, null, 2),
      "utf8"
    );

    return planRecursiveTask({
      workspaceRoot,
      rootObjective: "Inspect billing retry ownership"
    });
  }

  it("submits one structured analysis snippet into an existing recursive session and records a durable run result", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-run-"));
    tempRoots.push(workspaceRoot);
    const planned = await createPlannedSession(workspaceRoot);

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

  it("accepts stdin-submitted snippets and records a hashed source reference", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-run-stdin-"));
    tempRoots.push(workspaceRoot);
    const planned = await createPlannedSession(workspaceRoot);

    const executed = await runStructuredAnalysis({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      submissionMode: "stdin",
      stdinContent: `
export const metadata = {
  requestedBehaviors: ["read-runtime"]
};

export async function analyze(context) {
  const repoMap = await context.readHandle("repo-map");
  await context.appendScratch("stdin run inspected repo-map");
  return {
    outcome: "success",
    summary: "stdin submission worked",
    findings: [\`Repo services: \${repoMap.services.join(", ")}\`],
    artifactsRead: ["repo-map"]
  };
}
`
    });

    const storedResult = await loadRecursiveStructuredRunResult(workspaceRoot, planned.session.sessionId, executed.meta.runId);
    expect(executed.meta.submissionMode).toBe("stdin");
    expect(executed.meta.sourceRef).toMatch(/^sha256:/);
    expect(executed.meta.status).toBe("success");
    expect(storedResult?.findings[0] ?? executed.result.findings[0]).toContain("Repo services: billing");
  });

  it("records durable rejection artifacts when a snippet requests restricted behavior", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-run-reject-"));
    tempRoots.push(workspaceRoot);
    const planned = await createPlannedSession(workspaceRoot);

    const executed = await runStructuredAnalysis({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      submissionMode: "stdin",
      stdinContent: `
export const metadata = {
  requestedBehaviors: ["network"]
};

export async function analyze() {
  return {
    outcome: "success",
    summary: "should never execute"
  };
}
`
    });

    const [storedMeta, storedResult, listedRuns] = await Promise.all([
      loadRecursiveStructuredRun(workspaceRoot, planned.session.sessionId, executed.meta.runId),
      loadRecursiveStructuredRunResult(workspaceRoot, planned.session.sessionId, executed.meta.runId),
      listRecursiveStructuredRuns(workspaceRoot, planned.session.sessionId)
    ]);

    expect(executed.meta.status).toBe("rejection");
    expect(executed.result.outcome).toBe("rejection");
    expect(executed.meta.failureReason).toContain('restricted behavior "network"');
    expect(storedMeta?.status).toBe("rejection");
    expect(storedResult?.diagnostics).toEqual(expect.arrayContaining([expect.stringContaining('restricted behavior "network"')]));
    expect(listedRuns.map((run) => run.runId)).toContain(executed.meta.runId);
  });
});
