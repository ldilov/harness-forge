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
      strategy: plan.strategy,
      shardCount: plan.shards.length,
      statuses: plan.shards.map((shard) => ({
        shardId: shard.shardId,
        status: "planned",
        mergeReadiness: "unknown"
      }))
    }
  : {
      planId: null,
      strategy: "uninitialized",
      shardCount: 0,
      statuses: []
    };

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}
