#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const docsCommands = await fs.readFile(path.join(root, "docs", "commands.md"), "utf8");
const readme = await fs.readFile(path.join(root, "README.md"), "utf8");
const maintenanceDoc = await fs.readFile(path.join(root, "docs", "maintenance-lifecycle.md"), "utf8");
const flowDoc = await fs.readFile(path.join(root, "docs", "flow-orchestration.md"), "utf8");
const observabilityDoc = await fs.readFile(path.join(root, "docs", "observability.md"), "utf8");
const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));

const failures = [];
for (const command of [
  "install",
  "catalog",
  "recommend",
  "template validate",
  "template suggest",
  "flow status",
  "doctor",
  "audit",
  "sync",
  "diff-install",
  "upgrade-surface",
  "prune"
]) {
  if (!docsCommands.includes(command)) {
    failures.push({ file: "docs/commands.md", issue: `Missing command reference ${command}` });
  }
}

for (const fragment of ["flow status", "doctor", "audit", "validate:release"]) {
  if (!readme.includes(fragment)) {
    failures.push({ file: "README.md", issue: `Missing README reference ${fragment}` });
  }
}

for (const fragment of ["doctor", "audit", "diff-install", "sync", "upgrade-surface", "prune"]) {
  if (!maintenanceDoc.includes(fragment)) {
    failures.push({ file: "docs/maintenance-lifecycle.md", issue: `Missing maintenance command ${fragment}` });
  }
}

if (!flowDoc.includes("flow status")) {
  failures.push({ file: "docs/flow-orchestration.md", issue: "Missing flow status command reference." });
}

if (!observabilityDoc.includes("report-effectiveness")) {
  failures.push({ file: "docs/observability.md", issue: "Missing report-effectiveness command reference." });
}

for (const scriptName of [
  "validate:compatibility",
  "validate:skill-depth",
  "validate:framework-coverage",
  "validate:doc-command-alignment",
  "validate:runtime-consistency",
  "knowledge:coverage",
  "knowledge:drift",
  "flow:status",
  "observability:report"
]) {
  if (!packageJson.scripts?.[scriptName]) {
    failures.push({ file: "package.json", issue: `Missing npm script ${scriptName}` });
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true }, null, 2));
