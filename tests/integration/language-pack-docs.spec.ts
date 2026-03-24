import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const seededLanguages = ["typescript", "java", "dotnet", "lua", "powershell"] as const;

describe("language pack docs integration", () => {
  it("links seeded language docs and rule entrypoints to the imported knowledge", async () => {
    for (const language of seededLanguages) {
      const doc = await fs.readFile(path.join(root, `docs/catalog/languages/${language}.md`), "utf8");
      const rules = await fs.readFile(path.join(root, `rules/${language}/README.md`), "utf8");

      expect(doc).toContain(`knowledge-bases/seeded/${language}`);
      expect(rules).toContain(`knowledge-bases/seeded/${language}/rules/common/`);
      expect(rules).toContain(`knowledge-bases/seeded/${language}/rules/${language}/`);
    }
  });
});
