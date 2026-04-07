import { describe, expect, it, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { generateClaudeMd } from "../../src/application/install/generate-claude-md.js";

describe("generateClaudeMd", () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-claude-md-"));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("writes CLAUDE.md at the workspace root", async () => {
    const result = await generateClaudeMd(tmpDir);
    expect(result.claudeMdPath).toBe(path.join(tmpDir, "CLAUDE.md"));
    const stat = await fs.stat(result.claudeMdPath);
    expect(stat.isFile()).toBe(true);
  });

  it("CLAUDE.md contains the hforge command table", async () => {
    await generateClaudeMd(tmpDir);
    const content = await fs.readFile(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("hforge next");
    expect(content).toContain("hforge status --json");
    expect(content).toContain("hforge doctor --json");
    expect(content).toContain("hforge refresh");
    expect(content).toContain("hforge dashboard");
    expect(content).toContain("hforge loop");
    expect(content).toContain("hforge score");
    expect(content).toContain("hforge export --bundle");
  });

  it("CLAUDE.md references AGENTS.md", async () => {
    await generateClaudeMd(tmpDir);
    const content = await fs.readFile(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain("AGENTS.md");
  });

  it("CLAUDE.md includes the CLI resolution order", async () => {
    await generateClaudeMd(tmpDir);
    const content = await fs.readFile(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain(".hforge/generated/bin/hforge");
    expect(content).toContain("npx @harness-forge/cli");
    expect(content).toContain("Resolve CLI execution in this order:");
    expect(content).toMatch(/1\.\s.*\.hforge\/generated\/bin\/hforge/);
  });

  it("does not create .claude/commands/forge.md when .claude/ does not exist", async () => {
    const result = await generateClaudeMd(tmpDir);
    expect(result.commandsForgeCreated).toBe(false);
    expect(result.commandsForgePath).toBeNull();
  });

  it("creates .claude/commands/forge.md when .claude/ exists", async () => {
    await fs.mkdir(path.join(tmpDir, ".claude"), { recursive: true });
    const result = await generateClaudeMd(tmpDir);
    expect(result.commandsForgeCreated).toBe(true);
    expect(result.commandsForgePath).toBe(path.join(tmpDir, ".claude", "commands", "forge.md"));
    const content = await fs.readFile(result.commandsForgePath!, "utf-8");
    expect(content).toContain("$ARGUMENTS");
    expect(content).toContain("npx @harness-forge/cli");
    expect(content).toContain("--json");
  });

  it("CLAUDE.md contains the command catalog path", async () => {
    await generateClaudeMd(tmpDir);
    const content = await fs.readFile(path.join(tmpDir, "CLAUDE.md"), "utf-8");
    expect(content).toContain(".hforge/generated/agent-command-catalog.json");
  });
});
