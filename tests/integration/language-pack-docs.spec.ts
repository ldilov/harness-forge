import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const seededLanguages = [
  ["typescript", true],
  ["java", false],
  ["dotnet", false],
  ["lua", true],
  ["powershell", true]
] as const;

describe("language pack docs integration", () => {
  it("links seeded language docs and rule entrypoints to the imported knowledge", async () => {
    for (const [language, hasSkill] of seededLanguages) {
      const doc = await fs.readFile(path.join(root, `docs/catalog/languages/${language}.md`), "utf8");
      const rules = await fs.readFile(path.join(root, `rules/${language}/README.md`), "utf8");
      const workflow = await fs.readFile(path.join(root, `templates/workflows/implement-${language}-change.md`), "utf8");

      expect(doc).toContain(`knowledge-bases/seeded/${language}`);
      expect(rules).toContain("rules/common/");
      expect(rules).toContain(`rules/${language}/`);
      expect(rules).toContain(`knowledge-bases/seeded/${language}/rules/${language}/`);
      expect(workflow).toContain(`rules/${language}/`);

      if (hasSkill) {
        const skill = await fs.readFile(path.join(root, `skills/${language}-engineering/SKILL.md`), "utf8");
        const agentSkill = await fs.readFile(path.join(root, `.agents/skills/${language}-engineering/SKILL.md`), "utf8");

        expect(skill).toContain(`rules/${language}/`);
        expect(agentSkill).toContain(`.hforge/library/skills/${language}-engineering/SKILL.md`);
      } else {
        await expect(fs.access(path.join(root, `skills/${language}-engineering/SKILL.md`))).rejects.toThrow();
        await expect(fs.access(path.join(root, `.agents/skills/${language}-engineering/SKILL.md`))).rejects.toThrow();
      }
    }
  });
});
