import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("claude-code discovery contract", () => {
  it("CLAUDE.md exists in the repo root", async () => {
    const content = await fs.readFile(path.join(root, "CLAUDE.md"), "utf8");
    expect(content.length).toBeGreaterThan(0);
  });

  it("CLAUDE.md contains hforge next", async () => {
    const content = await fs.readFile(path.join(root, "CLAUDE.md"), "utf8");
    expect(content).toContain("hforge next");
  });

  it("CLAUDE.md contains npx fallback", async () => {
    const content = await fs.readFile(path.join(root, "CLAUDE.md"), "utf8");
    expect(content).toContain("npx @harness-forge/cli");
  });

  it("CLAUDE.md references AGENTS.md for full guidance", async () => {
    const content = await fs.readFile(path.join(root, "CLAUDE.md"), "utf8");
    expect(content).toContain("AGENTS.md");
  });

  it("CLAUDE.md includes resolution order", async () => {
    const content = await fs.readFile(path.join(root, "CLAUDE.md"), "utf8");
    expect(content).toContain(".hforge/generated/bin/hforge");
    expect(content).toContain("Resolve CLI execution in this order");
  });
});
