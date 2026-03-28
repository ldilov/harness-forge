import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("docs front door contract", () => {
  it("ships the expected entrypoint docs", async () => {
    const files = [
      "README.md",
      "docs/quickstart.md",
      "docs/installation.md",
      "docs/targets.md",
      "docs/languages.md",
      "docs/commands.md",
      "docs/agents.md",
      "docs/hooks/catalog.md",
      "docs/troubleshooting.md",
      "docs/versioning-and-migration.md"
    ];

    await Promise.all(files.map(async (relativePath) => expect(await fs.readFile(path.join(root, relativePath), "utf8")).toBeTruthy()));
  });

  it("keeps front-door docs aligned around install, command, and target guidance", async () => {
    const [installation, commands, agents] = await Promise.all([
      fs.readFile(path.join(root, "docs", "installation.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "commands.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "agents.md"), "utf8")
    ]);

    expect(installation).toContain(".hforge/library/knowledge/");
    expect(installation).toContain("npx @harness-forge/cli");
    expect(installation).toContain("--dry-run");
    expect(installation).toContain("shell setup");
    expect(commands).toContain("target inspect");
    expect(commands).toContain("cartograph");
    expect(agents).toContain("Codex");
    expect(agents).toContain("Claude Code");
  });
});
