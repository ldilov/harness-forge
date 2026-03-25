#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const operationalSkills = [
  "repo-onboarding",
  "security-scan",
  "release-readiness",
  "documentation-lookup",
  "architecture-decision-records",
  "incident-triage",
  "dependency-upgrade-safety",
  "performance-profiling",
  "test-strategy-and-coverage",
  "api-contract-review",
  "db-migration-review",
  "pr-triage-and-summary",
  "observability-setup",
  "repo-modernization",
  "cloud-architect"
];
const languageSkills = [
  "python-engineering",
  "go-engineering",
  "kotlin-engineering",
  "rust-engineering",
  "cpp-engineering",
  "php-engineering",
  "perl-engineering",
  "swift-engineering",
  "shell-engineering"
];
const failures = [];

for (const skillId of operationalSkills) {
  const filePath = path.join(root, "skills", skillId, "SKILL.md");
  const content = await fs.readFile(filePath, "utf8");
  for (const section of ["## Trigger Signals", "## Inspect First", "## Workflow", "## Output Contract", "## Failure Modes", "## Escalation"]) {
    if (!content.includes(section)) {
      failures.push({ skillId, file: `skills/${skillId}/SKILL.md`, issue: `Missing section ${section}` });
    }
  }

  for (const match of content.matchAll(/`(skills\/[^`]+)`/g)) {
    const referencedPath = match[1];
    try {
      await fs.access(path.join(root, referencedPath));
    } catch {
      failures.push({ skillId, file: `skills/${skillId}/SKILL.md`, issue: `Missing referenced file ${referencedPath}` });
    }
  }
}

for (const skillId of languageSkills) {
  const filePath = path.join(root, "skills", skillId, "SKILL.md");
  const content = await fs.readFile(filePath, "utf8");
  for (const section of ["## Activation", "## Load Order", "## Execution Contract", "## Validation", "## Escalation"]) {
    if (!content.includes(section)) {
      failures.push({ skillId, file: `skills/${skillId}/SKILL.md`, issue: `Missing section ${section}` });
    }
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, operationalSkills: operationalSkills.length, languageSkills: languageSkills.length }, null, 2));
