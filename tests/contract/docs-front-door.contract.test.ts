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

  it("explains the seeded knowledge and release validation surface", async () => {
    const readme = await fs.readFile(path.join(root, "README.md"), "utf8");
    expect(readme).toContain(".hforge/library/knowledge/");
    expect(readme).toContain("npm run validate:release");
    expect(readme).toContain("npx @harness-forge/cli");
    expect(readme).toContain("--dry-run");
    expect(readme).toContain("project hub");
    expect(readme).toContain("npx @harness-forge/cli bootstrap --root . --yes");
    expect(readme).toContain("shell setup");
    expect(readme).toContain("target inspect");
    expect(readme).toContain("cartograph");
    expect(readme).toContain("does not");
    expect(readme).toContain("Codex");
    expect(readme).toContain("Claude Code");
  });
});
