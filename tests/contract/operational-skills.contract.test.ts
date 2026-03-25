import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const operationalSkills = [
  ["repo-onboarding", "skills/repo-onboarding/references/output-template.md"],
  ["security-scan", "skills/security-scan/references/review-checklist.md"],
  ["release-readiness", "skills/release-readiness/references/release-report-template.md"],
  ["documentation-lookup", "skills/documentation-lookup/references/source-priority.md"],
  ["architecture-decision-records", "skills/architecture-decision-records/references/adr-template.md"],
  ["incident-triage", null],
  ["dependency-upgrade-safety", null],
  ["performance-profiling", null],
  ["test-strategy-and-coverage", null],
  ["api-contract-review", null],
  ["db-migration-review", null],
  ["pr-triage-and-summary", null],
  ["observability-setup", null],
  ["repo-modernization", null],
  ["cloud-architect", null]
] as const;

describe("operational skill contract", () => {
  it("keeps operational and workload skills explicit", async () => {
    for (const [skillId, referencePath] of operationalSkills) {
      const content = await fs.readFile(path.join(root, "skills", skillId, "SKILL.md"), "utf8");
      expect(content).toContain("## Trigger Signals");
      expect(content).toContain("## Inspect First");
      expect(content).toContain("## Workflow");
      expect(content).toContain("## Output Contract");
      expect(content).toContain("## Failure Modes");
      expect(content).toContain("## Escalation");

      if (referencePath) {
        await expect(fs.readFile(path.join(root, referencePath), "utf8")).resolves.toBeTruthy();
      }
    }
  });
});
