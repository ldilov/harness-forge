import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("recursive promotion surfaces contract", () => {
  it("keeps recursive structured-analysis discoverable through shared guidance and skill surfaces", async () => {
    const [agents, docsAgents, readme, canonicalSkill, wrapperSkill] = await Promise.all([
      fs.readFile(path.join(root, "AGENTS.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "agents.md"), "utf8"),
      fs.readFile(path.join(root, "README.md"), "utf8"),
      fs.readFile(path.join(root, "skills", "recursive-structured-analysis", "SKILL.md"), "utf8"),
      fs.readFile(path.join(root, ".agents", "skills", "recursive-structured-analysis", "SKILL.md"), "utf8")
    ]);

    expect(agents).toContain(".hforge/runtime/recursive/language-capabilities.json");
    expect(agents).toContain("recursive capabilities");
    expect(docsAgents).toContain("recursive structured analysis");
    expect(readme).toContain("structured recursive analysis");
    expect(canonicalSkill).toContain("hforge recursive run");
    expect(wrapperSkill).toContain(".hforge/library/skills/recursive-structured-analysis/SKILL.md");
  });
});
