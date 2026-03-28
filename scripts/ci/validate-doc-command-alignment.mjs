#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const docsCommands = await fs.readFile(path.join(root, "docs", "commands.md"), "utf8");
const readme = await fs.readFile(path.join(root, "README.md"), "utf8");
const maintenanceDoc = await fs.readFile(path.join(root, "docs", "maintenance-lifecycle.md"), "utf8");
const flowDoc = await fs.readFile(path.join(root, "docs", "flow-orchestration.md"), "utf8");
const observabilityDoc = await fs.readFile(path.join(root, "docs", "observability.md"), "utf8");
const troubleshootingDoc = await fs.readFile(path.join(root, "docs", "troubleshooting.md"), "utf8");
const releaseProcessDoc = await fs.readFile(path.join(root, "docs", "release-process.md"), "utf8");
const contributingDoc = await fs.readFile(path.join(root, "CONTRIBUTING.md"), "utf8");
const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));

const failures = [];
for (const command of [
  "init",
  "install",
  "bootstrap",
  "refresh",
  "task list",
  "task inspect",
  "pack inspect",
  "review",
  "export",
  "commands",
  "catalog",
  "recommend",
  "scan",
  "cartograph",
  "classify-boundaries",
  "synthesize-instructions",
  "target inspect",
  "capabilities",
  "template validate",
  "template suggest",
  "flow status",
  "observability summarize",
  "observability report",
  "parallel plan",
  "parallel status",
  "parallel merge-check",
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

for (const fragment of ["flow status", "doctor", "audit", "cartograph", "target inspect", "validate:release", "validate:local", "release:dry-run"]) {
  if (!readme.includes(fragment)) {
    failures.push({ file: "README.md", issue: `Missing README reference ${fragment}` });
  }
}

for (const fragment of ["doctor", "audit", "refresh", "diff-install", "sync", "upgrade-surface", "prune"]) {
  if (!maintenanceDoc.includes(fragment)) {
    failures.push({ file: "docs/maintenance-lifecycle.md", issue: `Missing maintenance command ${fragment}` });
  }
}

if (!flowDoc.includes("flow status")) {
  failures.push({ file: "docs/flow-orchestration.md", issue: "Missing flow status command reference." });
}

for (const fragment of ["report-effectiveness", "observability summarize", "observability report"]) {
  if (!observabilityDoc.includes(fragment)) {
    failures.push({ file: "docs/observability.md", issue: `Missing observability command reference ${fragment}.` });
  }
}

for (const fragment of ["doctor", "audit", "refresh"]) {
  if (!troubleshootingDoc.includes(fragment)) {
    failures.push({ file: "docs/troubleshooting.md", issue: `Missing troubleshooting reference ${fragment}.` });
  }
}

for (const fragment of ["validate:release", "release:dry-run"]) {
  if (!releaseProcessDoc.includes(fragment)) {
    failures.push({ file: "docs/release-process.md", issue: `Missing release-process reference ${fragment}.` });
  }
}

for (const fragment of ["validate:local", "validate:release"]) {
  if (!contributingDoc.includes(fragment)) {
    failures.push({ file: "CONTRIBUTING.md", issue: `Missing contributor validation reference ${fragment}.` });
  }
}

for (const fragment of ["parallel plan", "parallel status", "parallel merge-check"]) {
  if (!flowDoc.includes(fragment)) {
    failures.push({ file: "docs/flow-orchestration.md", issue: `Missing flow command reference ${fragment}.` });
  }
}

for (const scriptName of [
  "recommend:current",
  "cartograph:current",
  "instructions:codex",
  "target:codex",
  "target:claude-code",
  "target:opencode",
  "smoke:cli",
  "validate:local",
  "validate:compatibility",
  "validate:skill-depth",
  "validate:framework-coverage",
  "validate:doc-command-alignment",
  "validate:runtime-consistency",
  "knowledge:coverage",
  "knowledge:drift",
  "flow:status",
  "observability:summary",
  "observability:report",
  "release:dry-run"
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
