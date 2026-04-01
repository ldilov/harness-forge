import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseFrontMatter } from "../../scripts/ci/lib/context-surface-dedup.mjs";

const root = process.cwd();
const languages = ["typescript", "java", "dotnet", "lua", "powershell", "python", "go", "kotlin", "rust", "cpp", "php", "perl", "swift", "shell"];

describe("derivative surface contract", () => {
  it("declares canonical sources for language discovery wrappers", async () => {
    for (const language of languages) {
      const relativePath = `.agents/skills/${language}-engineering/SKILL.md`;
      const content = await fs.readFile(path.join(root, relativePath), "utf8");
      const parsed = parseFrontMatter(content);

      expect(parsed?.metadata.generated).toBe(true);
      expect(parsed?.metadata.canonical_source).toBe(`skills/${language}-engineering/SKILL.md`);
    }
  });
});
