import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const seededLanguages = ["typescript", "java", "dotnet", "lua", "powershell"] as const;

describe("seeded operational surfaces", () => {
  it("promotes common rule files from the seeded archive", async () => {
    const commonFiles = [
      "agents.md",
      "coding-style.md",
      "development-workflow.md",
      "git-workflow.md",
      "hooks.md",
      "patterns.md",
      "performance.md",
      "security.md",
      "testing.md"
    ];

    for (const file of commonFiles) {
      await expect(fs.access(path.join(root, "rules/common", file))).resolves.toBeUndefined();
    }
  });

  it("ships language skills and workflows for every seeded language", async () => {
    for (const language of seededLanguages) {
      await expect(fs.access(path.join(root, "skills", `${language}-engineering`, "SKILL.md"))).resolves.toBeUndefined();
      await expect(fs.access(path.join(root, ".agents/skills", `${language}-engineering`, "SKILL.md"))).resolves.toBeUndefined();
      await expect(fs.access(path.join(root, "templates/workflows", `implement-${language}-change.md`))).resolves.toBeUndefined();
    }
  });
});
