#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = process.cwd();
const planPath = path.join(root, ".hforge", "generated", "parallel-plan.json");

let plan = null;
try {
  plan = JSON.parse(await fs.readFile(planPath, "utf8"));
} catch {
  plan = null;
}

const result = plan
  ? {
      planId: plan.planId,
      status: plan.strategy === "single-thread" ? "blocked" : "ready",
      reasons: plan.strategy === "single-thread" ? [plan.fallbackToSingleThreadReason].filter(Boolean) : ["Shard plan has been generated."],
      overlapPaths: plan.sharedRiskPaths ?? [],
      staleDependencies: [],
      missingArtifacts: [],
      requiredActions:
        plan.strategy === "single-thread"
          ? ["Continue implementation in a single worktree."]
          : ["Validate each shard before merge.", "Confirm merge criteria remain satisfied."]
    }
  : {
      planId: null,
      status: "blocked",
      reasons: ["No parallel plan has been generated yet."],
      overlapPaths: [],
      staleDependencies: [],
      missingArtifacts: [],
      requiredActions: ["Create a parallel plan before checking merge readiness."]
    };

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}
