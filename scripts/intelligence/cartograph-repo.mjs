#!/usr/bin/env node
import path from "node:path";

import { buildRepoMap } from "./shared/cartography.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");
const repoMap = await buildRepoMap(root);

if (json) {
  console.log(JSON.stringify(repoMap, null, 2));
} else {
  console.log(JSON.stringify(repoMap, null, 2));
}
