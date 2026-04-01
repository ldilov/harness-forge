import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { validateWrapperThinness } from "../../scripts/ci/lib/context-surface-dedup.mjs";

const root = process.cwd();
const wrappers = ["typescript", "java", "dotnet", "lua", "powershell", "python", "go", "kotlin", "rust", "cpp", "php", "perl", "swift", "shell"];

describe("wrapper thinness contract", () => {
  it("keeps language discovery wrappers routing-focused and canonical-source backed", async () => {
    const failures = [];

    for (const language of wrappers) {
      const relativePath = `.agents/skills/${language}-engineering/SKILL.md`;
      const content = await fs.readFile(path.join(root, relativePath), "utf8");
      failures.push(...validateWrapperThinness(content, relativePath));
    }

    expect(failures).toEqual([]);
  });
});
