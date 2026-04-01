import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { planRecursiveTask } from "../../src/application/recursive/plan-task.js";

export async function createRecursiveRlmWorkspace(prefix: string): Promise<string> {
  const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  await fs.mkdir(path.join(workspaceRoot, ".hforge", "runtime", "repo"), { recursive: true });
  await fs.writeFile(
    path.join(workspaceRoot, ".hforge", "runtime", "repo", "repo-map.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        services: ["billing"],
        highRiskPaths: [],
        criticalPaths: []
      },
      null,
      2
    ),
    "utf8"
  );
  return workspaceRoot;
}

export async function createRecursiveRlmSession(workspaceRoot: string) {
  return planRecursiveTask({
    workspaceRoot,
    taskId: "TASK-REC-001",
    rootObjective: "Inspect the billing retry runtime"
  });
}

export function fixturePath(...segments: string[]): string {
  return path.join(process.cwd(), "tests", "fixtures", "recursive-rlm", ...segments);
}
