import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const structuredLanguages = [
  ["python", "python", "framework:fastapi"],
  ["go", "golang", "framework:gin"],
  ["kotlin", "kotlin", "framework:ktor"],
  ["rust", "rust", ""],
  ["cpp", "cpp", ""],
  ["php", "php", "framework:laravel"],
  ["swift", "swift", ""],
  ["shell", "shell", ""],
  ["perl", "perl", ""]
] as const;

describe("structured pack depth contract", () => {
  it("keeps every structured pack operationally deep", async () => {
    for (const [docId, ruleId, frameworkCue] of structuredLanguages) {
      const doc = await fs.readFile(path.join(root, `docs/catalog/languages/${docId}.md`), "utf8");
      const skill = await fs.readFile(path.join(root, `skills/${docId}-engineering/SKILL.md`), "utf8");
      const agentSkill = await fs.readFile(path.join(root, `.agents/skills/${docId}-engineering/SKILL.md`), "utf8");
      const rulesReadme = await fs.readFile(path.join(root, `rules/${ruleId}/README.md`), "utf8");

      expect(doc).toContain("## When to Install");
      expect(doc).toContain("## Pack Depth");
      expect(doc).toContain("## Examples");
      expect(skill).toContain("## Activation");
      expect(skill).toContain("## Load Order");
      expect(skill).toContain("## Execution Contract");
      expect(skill).toContain("## Validation");
      expect(skill).toContain("## Escalation");
      expect(agentSkill).toContain("## Activation");
      expect(agentSkill).toContain("## Use These Surfaces");
      expect(rulesReadme).toContain("## Apply Order");
      expect(rulesReadme).toContain("## Focus Areas");
      expect(rulesReadme).toContain("## Related Pack Assets");

      if (frameworkCue) {
        expect(doc).toContain(frameworkCue);
      }
    }
  });
});
