import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("hforge-init command contract", () => {
  it("orients agents through the compact brief before broad scans", async () => {
    const content = await fs.readFile(path.join(process.cwd(), "commands", "hforge-init.md"), "utf8");

    expect(content).toContain(".hforge/runtime/agent-brief.md");
    expect(content).toContain(".hforge/generated/agent-command-catalog.json");
    expect(content).toContain("before broad repository scans");
    expect(content).toContain("hforge refresh --root . --json");
    expect(content).toContain(".hforge/library/skills/complex-task-protocol/SKILL.md");
    expect(content).toContain("do not require `/hforge-init` as the trigger");
  });
});
