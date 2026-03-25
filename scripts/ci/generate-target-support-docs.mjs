#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

import { loadCapabilityInputs, renderTargetSupportMarkdown } from "./capability-matrix-shared.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = process.cwd();
const destination = path.join(root, "docs", "target-support-matrix.md");

const { taxonomy, matrix } = await loadCapabilityInputs(root);
const content = renderTargetSupportMarkdown(taxonomy, matrix);
await fs.writeFile(destination, content, "utf8");

const result = {
  ok: true,
  destination,
  targets: matrix.targets.length,
  capabilities: taxonomy.capabilities.length
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}
