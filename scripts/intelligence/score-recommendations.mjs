#!/usr/bin/env node
import path from "node:path";

import { formatHumanReadable, scoreRecommendations } from "./shared.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");

const result = await scoreRecommendations(root);

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(formatHumanReadable(result));
}
