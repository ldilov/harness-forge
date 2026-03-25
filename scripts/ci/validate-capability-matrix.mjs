#!/usr/bin/env node
import { collectCapabilityValidationIssues, loadCapabilityInputs } from "./capability-matrix-shared.mjs";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = process.cwd();
const issues = await collectCapabilityValidationIssues(root);

if (issues.length > 0) {
  const result = { ok: false, issues };
  if (json) {
    console.error(JSON.stringify(result, null, 2));
  } else {
    console.error(JSON.stringify(result, null, 2));
  }
  process.exit(1);
}

const { taxonomy, matrix } = await loadCapabilityInputs(root);
const result = {
  ok: true,
  targets: matrix.targets.length,
  capabilities: taxonomy.capabilities.length
};

if (json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(JSON.stringify(result, null, 2));
}
