import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("engineering assistant helper flow baseline", () => {
  it("connects the canonical skill to project-memory and change-discipline guidance", async () => {
    const skill = await fs.readFile(path.join(root, "skills", "engineering-assistant", "SKILL.md"), "utf8");
    const portDoc = await fs.readFile(path.join(root, "docs", "authoring", "engineering-assistant-port.md"), "utf8");

    expect(skill).toContain("skills/engineering-assistant/references/project-notes.md");
    expect(skill).toContain("skills/engineering-assistant/references/change-discipline.md");
    expect(portDoc).toContain("Until packaged helper commands land");
    expect(portDoc).toContain("helper-surface planning");
  });
});
