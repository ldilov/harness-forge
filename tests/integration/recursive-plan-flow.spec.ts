import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { planRecursiveTask } from "../../src/application/recursive/plan-task.js";
import { resolveTaskArtifactPaths } from "../../src/application/runtime/task-runtime-store.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive plan flow integration", () => {
  it("creates a durable draft recursive session and links it back to the task runtime", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-recursive-plan-"));
    tempRoots.push(workspaceRoot);

    await fs.mkdir(path.join(workspaceRoot, ".hforge", "runtime", "repo"), { recursive: true });
    await fs.writeFile(
      path.join(workspaceRoot, ".hforge", "runtime", "repo", "repo-map.json"),
      JSON.stringify({ generatedAt: new Date().toISOString(), services: [], highRiskPaths: [], criticalPaths: [] }, null, 2),
      "utf8"
    );

    const taskPaths = resolveTaskArtifactPaths(workspaceRoot, "TASK-REC-001");
    await fs.mkdir(taskPaths.taskDir, { recursive: true });
    await fs.writeFile(
      taskPaths.taskPackPath,
      JSON.stringify({ taskId: "TASK-REC-001", title: "Investigate billing retries" }, null, 2),
      "utf8"
    );

    const result = await planRecursiveTask({
      workspaceRoot,
      taskId: "TASK-REC-001",
      rootObjective: "Investigate the cross-module billing retry flow"
    });

    expect(result.session.taskId).toBe("TASK-REC-001");
    expect(result.session.status).toBe("draft");
    expect(result.session.handles.some((handle) => handle.targetRef.endsWith("repo/repo-map.json"))).toBe(true);
    expect(result.session.handles.some((handle) => handle.targetRef.endsWith("tasks/TASK-REC-001/task-pack.json"))).toBe(true);
    expect(await fs.readFile(result.artifactPaths.sessionPath, "utf8")).toContain("\"status\": \"draft\"");
    expect(await fs.readFile(result.artifactPaths.summaryPath, "utf8")).toContain("\"outcome\": \"draft\"");
    expect(await fs.readFile(result.artifactPaths.tracePath, "utf8")).toContain("\"eventType\":\"tool-call\"");
    expect(await fs.readFile(taskPaths.recursiveSessionLinkPath, "utf8")).toContain(result.session.sessionId);
  });
});
