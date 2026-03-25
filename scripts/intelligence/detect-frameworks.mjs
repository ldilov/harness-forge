#!/usr/bin/env node
import path from "node:path";

import { collectRepoFacts, formatHumanReadable } from "./shared.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");

const result = await collectRepoFacts(root);

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(formatHumanReadable(result));
}
