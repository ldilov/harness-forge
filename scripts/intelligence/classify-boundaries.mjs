#!/usr/bin/env node
import path from "node:path";

import { classifyServiceBoundaries } from "./shared/cartography.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");
const boundaries = await classifyServiceBoundaries(root);

if (json) {
  console.log(JSON.stringify({ root, boundaries }, null, 2));
} else {
  console.log(JSON.stringify({ root, boundaries }, null, 2));
}
