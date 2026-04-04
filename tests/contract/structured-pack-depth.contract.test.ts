import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const structuredLanguages = [
  ["python", "python", "framework:fastapi", true],
  ["go", "golang", "framework:gin", false],
  ["kotlin", "kotlin", "framework:ktor", false],
  ["rust", "rust", "", false],
  ["cpp", "cpp", "", false],
  ["php", "php", "framework:laravel", true],
  ["swift", "swift", "", false],
  ["shell", "shell", "", true],
  ["perl", "perl", "", true]
] as const;

describe("structured pack depth contract", () => {
  it("keeps every structured pack operationally deep", async () => {
    for (const [docId, ruleId, frameworkCue, hasSkill] of structuredLanguages) {
      const doc = await fs.readFile(path.join(root, `docs/catalog/languages/${docId}.md`), "utf8");
      const rulesReadme = await fs.readFile(path.join(root, `rules/${ruleId}/README.md`), "utf8");

      expect(doc).toContain("## When to Install");
      expect(doc).toContain("## Pack Depth");
      expect(doc).toContain("## Examples");
      expect(rulesReadme).toContain("## Apply Order");
      expect(rulesReadme).toContain("## Focus Areas");
      expect(rulesReadme).toContain("## Related Pack Assets");

      if (hasSkill) {
        const skill = await fs.readFile(path.join(root, `skills/${docId}-engineering/SKILL.md`), "utf8");
        const agentSkill = await fs.readFile(path.join(root, `.agents/skills/${docId}-engineering/SKILL.md`), "utf8");

        expect(skill).toContain("## Activation");
        expect(skill).toContain("## Load Order");
        expect(skill).toContain("## Execution Contract");
        expect(skill).toContain("## Validation");
        expect(skill).toContain("## Escalation");
        expect(agentSkill).toContain("## Activation");
        expect(agentSkill).toContain("## Use These Surfaces");
      } else {
        await expect(fs.access(path.join(root, `skills/${docId}-engineering/SKILL.md`))).rejects.toThrow();
        await expect(fs.access(path.join(root, `.agents/skills/${docId}-engineering/SKILL.md`))).rejects.toThrow();
      }

      if (frameworkCue) {
        expect(doc).toContain(frameworkCue);
      }
    }
  });
});
