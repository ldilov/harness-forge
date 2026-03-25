#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const taskFile = path.resolve(args.find((value) => !value.startsWith("--")) ?? "specs/004-enhancement-pack-foundations/tasks.md");
const root = process.cwd();
const content = await fs.readFile(taskFile, "utf8");
const lines = content.split(/\r?\n/);
const tasks = lines
  .filter((line) => /^- \[[ xX]\] T\d+/.test(line))
  .map((line) => {
    const id = line.match(/T\d+/)?.[0] ?? "unknown";
    return {
      id,
      parallel: line.includes("[P]"),
      description: line
    };
  });

const parallelTasks = tasks.filter((task) => task.parallel);
const plan = {
  planId: `parallel-${path.basename(path.dirname(taskFile))}`,
  featureId: path.basename(path.dirname(taskFile)),
  strategy: parallelTasks.length >= 2 ? "local-isolated" : "single-thread",
  rootTask: `Implement ${path.basename(path.dirname(taskFile))}`,
  shards:
    parallelTasks.length >= 2
      ? parallelTasks.map((task, index) => ({
          shardId: `shard-${index + 1}`,
          taskIds: [task.id],
          worktreePath: `.worktrees/${task.id}`,
          risk: "low"
        }))
      : [
          {
            shardId: "main",
            taskIds: tasks.slice(0, 10).map((task) => task.id),
            worktreePath: ".",
            risk: "medium"
          }
        ],
  dependencies: [],
  sharedRiskPaths: [],
  expectedArtifacts: ["docs/target-support-matrix.md", "manifests/catalog/harness-capability-matrix.json"],
  validationGates: ["npm run validate:capability-matrix", "npm run test"],
  mergeCriteria: ["All shard validations passing", "No blocked shards"],
  rollbackPlan: "Resume single-threaded execution if shard overlap becomes unsafe.",
  fallbackToSingleThreadReason: parallelTasks.length >= 2 ? null : "Not enough low-overlap tasks were detected."
};

const destination = path.join(root, ".hforge", "generated", "parallel-plan.json");
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

if (json) {
  console.log(JSON.stringify(plan, null, 2));
} else {
  console.log(JSON.stringify(plan, null, 2));
}
