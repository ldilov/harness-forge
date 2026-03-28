import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("engineering assistant canonical skill", () => {
  it("ships the imported orchestration contract through a project-owned skill", async () => {
    const skill = await fs.readFile(path.join(root, "skills", "engineering-assistant", "SKILL.md"), "utf8");

    expect(skill).toContain("## Trigger Signals");
    expect(skill).toContain("## Inspect First");
    expect(skill).toContain("## Workflow");
    expect(skill).toContain("## Output Contract");
    expect(skill).toContain("## Failure Modes");
    expect(skill).toContain("## Escalation");
    expect(skill).toContain("at least two viable options");
    expect(skill).toContain("smallest reversible step");
    expect(skill).toContain("project-memory");
    expect(skill).toContain("change-discipline");
  });

  it("ships the adapted reference pack for architecture, composition, notes, and change discipline", async () => {
    const references = [
      "skills/engineering-assistant/references/architecture.md",
      "skills/engineering-assistant/references/solid-and-patterns.md",
      "skills/engineering-assistant/references/skill-composition.md",
      "skills/engineering-assistant/references/project-notes.md",
      "skills/engineering-assistant/references/change-discipline.md"
    ];

    for (const reference of references) {
      const content = await fs.readFile(path.join(root, reference), "utf8");
      expect(content.length).toBeGreaterThan(120);
    }
  });
});
