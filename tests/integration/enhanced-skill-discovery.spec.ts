import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const wrappedSkills = [
  "repo-onboarding",
  "architecture-decision-records",
  "api-contract-review",
  "db-migration-review",
  "parallel-worktree-supervisor",
  "repo-modernization",
  "typescript-engineering",
  "dotnet-engineering",
  "lua-engineering",
  "javascript-engineering"
];

describe("enhanced skill discovery integration", () => {
  it("publishes discovery wrappers that route agents into canonical skills and provenance", async () => {
    const agentsDoc = await fs.readFile(path.join(root, "docs", "agents.md"), "utf8");
    const readme = await fs.readFile(path.join(root, "README.md"), "utf8");

    expect(agentsDoc).toContain(".agents/skills/");
    expect(agentsDoc).toContain("docs/authoring/enhanced-skill-import.md");
    expect(agentsDoc).toContain("RESEARCH-SOURCES.md");
    expect(agentsDoc).toContain("VALIDATION.md");
    expect(readme).toContain("Skill discovery layer");
    expect(readme).toContain("Canonical skill layer");

    for (const skillId of wrappedSkills) {
      const wrapperContent = await fs.readFile(
        path.join(root, ".agents", "skills", skillId, "SKILL.md"),
        "utf8"
      );

      expect(wrapperContent).toContain(`skills/${skillId}/SKILL.md`);
      expect(wrapperContent).toContain("docs/authoring/enhanced-skill-import.md");
      expect(wrapperContent).toContain("RESEARCH-SOURCES.md");
      expect(wrapperContent).toContain("VALIDATION.md");
    }
  });
});
