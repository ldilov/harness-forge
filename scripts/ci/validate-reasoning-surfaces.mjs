#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const args = new Set(process.argv.slice(2));

const requiredFiles = [
  ".hforge/templates/reasoning/contracts/semiformal-core-contract.md",
  ".hforge/templates/reasoning/logs/semiformal-exploration-log.md",
  ".hforge/templates/reasoning/ledgers/function-trace-table.md",
  ".hforge/templates/reasoning/ledgers/data-flow-and-semantic-properties.md",
  ".hforge/templates/reasoning/certificates/patch-equivalence-certificate.md",
  ".hforge/templates/reasoning/certificates/fault-localization-certificate.md",
  ".hforge/templates/reasoning/certificates/code-question-answering-certificate.md",
  ".hforge/templates/reasoning/certificates/change-safety-certificate.md",
  ".hforge/templates/reasoning/workflows/universal-semiformal-investigation-workflow.md",
  ".hforge/templates/reasoning/workflows/pre-merge-semiformal-review-workflow.md",
  ".hforge/templates/reasoning/contracts/reasoning-artifact-interface.md",
  ".hforge/templates/reasoning/contracts/pre-merge-decision-interface.md",
  "docs/reasoning/index.md",
  "docs/reasoning/success-metrics.md"
];

const parityPairs = [
  [".hforge/templates/reasoning/contracts/semiformal-core-contract.md", "templates/reasoning/contracts/semiformal-core-contract.md"],
  [".hforge/templates/reasoning/logs/semiformal-exploration-log.md", "templates/reasoning/logs/semiformal-exploration-log.md"],
  [".hforge/templates/reasoning/ledgers/function-trace-table.md", "templates/reasoning/ledgers/function-trace-table.md"],
  [".hforge/templates/reasoning/ledgers/data-flow-and-semantic-properties.md", "templates/reasoning/ledgers/data-flow-and-semantic-properties.md"],
  [".hforge/templates/reasoning/certificates/patch-equivalence-certificate.md", "templates/reasoning/certificates/patch-equivalence-certificate.md"],
  [".hforge/templates/reasoning/certificates/fault-localization-certificate.md", "templates/reasoning/certificates/fault-localization-certificate.md"],
  [".hforge/templates/reasoning/certificates/code-question-answering-certificate.md", "templates/reasoning/certificates/code-question-answering-certificate.md"],
  [".hforge/templates/reasoning/certificates/change-safety-certificate.md", "templates/reasoning/certificates/change-safety-certificate.md"],
  [".hforge/templates/reasoning/workflows/universal-semiformal-investigation-workflow.md", "templates/reasoning/workflows/universal-semiformal-investigation-workflow.md"],
  [".hforge/templates/reasoning/workflows/pre-merge-semiformal-review-workflow.md", "templates/reasoning/workflows/pre-merge-semiformal-review-workflow.md"],
  [".hforge/templates/reasoning/contracts/reasoning-artifact-interface.md", "templates/reasoning/contracts/reasoning-artifact-interface.md"],
  [".hforge/templates/reasoning/contracts/pre-merge-decision-interface.md", "templates/reasoning/contracts/pre-merge-decision-interface.md"]
];

const failures = [];

const normalize = (value) => value.replace(/\r\n/g, "\n");

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

for (const file of requiredFiles) {
  if (!(await exists(file))) {
    failures.push(`Missing required file: ${file}`);
  }
}

for (const [canonical, bridge] of parityPairs) {
  const [hasCanonical, hasBridge] = await Promise.all([exists(canonical), exists(bridge)]);
  if (!hasCanonical || !hasBridge) {
    failures.push(`Parity pair missing: ${canonical} <-> ${bridge}`);
    continue;
  }
  const [a, b] = await Promise.all([
    fs.readFile(path.join(root, canonical), "utf8"),
    fs.readFile(path.join(root, bridge), "utf8")
  ]);
  if (normalize(a) !== normalize(b)) {
    failures.push(`Parity mismatch: ${canonical} != ${bridge}`);
  }
}

const metricsPath = path.join(root, "docs/reasoning/success-metrics.md");
if (await exists("docs/reasoning/success-metrics.md")) {
  const metrics = await fs.readFile(metricsPath, "utf8");
  for (let i = 1; i <= 10; i += 1) {
    const id = `SC-${String(i).padStart(3, "0")}`;
    if (!metrics.includes(id)) {
      failures.push(`Missing success criterion mapping in metrics doc: ${id}`);
    }
  }
}

if (args.has("--summary")) {
  if (failures.length === 0) {
    console.log("[reasoning-surfaces] PASS: required files, parity, and metrics checks are valid.");
  } else {
    console.log(`[reasoning-surfaces] FAIL: ${failures.length} issue(s) detected.`);
  }
}

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("reasoning surface validation passed");

