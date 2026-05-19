import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function parseFrontMatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return null;
  }

  const metadata: Record<string, unknown> = {};
  let currentArrayKey: string | null = null;
  for (const line of match[1].replaceAll("\r", "").split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      const next = metadata[currentArrayKey];
      if (Array.isArray(next)) {
        next.push(arrayItemMatch[1].trim());
      }
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!keyMatch) {
      continue;
    }

    const [, key, rawValue = ""] = keyMatch;
    if (!rawValue.trim()) {
      metadata[key] = [];
      currentArrayKey = key;
      continue;
    }

    metadata[key] = rawValue.trim();
    currentArrayKey = null;
  }

  return metadata;
}

describe("double diamond and bug investigation surface contract", () => {
  it("declares the workflow skills and command docs in the package-surface manifest", async () => {
    const manifest = JSON.parse(
      await fs.readFile(path.join(root, "manifests/catalog/package-surface.json"), "utf8")
    );

    expect(manifest.requiredPaths).toContain("skills/double-diamond-feature/SKILL.md");
    expect(manifest.requiredPaths).toContain("skills/bug-investigation/SKILL.md");
    expect(manifest.requiredPaths).toContain(".agents/skills/double-diamond-feature/SKILL.md");
    expect(manifest.requiredPaths).toContain(".agents/skills/bug-investigation/SKILL.md");
    expect(manifest.requiredPaths).toContain("commands/hforge-double-diamond.md");
    expect(manifest.requiredPaths).toContain("commands/hforge-bug-diamond.md");

    const rootDocs = manifest.groups.find(
      (group: { id?: string; name?: string }) => group.id === "root-docs" || group.name === "root-docs"
    );
    expect(rootDocs.paths).toContain("commands/hforge-double-diamond.md");
    expect(rootDocs.paths).toContain("commands/hforge-bug-diamond.md");
  });

  it("keeps required frontmatter on the canonical and bridge skills", async () => {
    const skillFiles = [
      "skills/double-diamond-feature/SKILL.md",
      "skills/bug-investigation/SKILL.md",
      ".agents/skills/double-diamond-feature/SKILL.md",
      ".agents/skills/bug-investigation/SKILL.md"
    ];

    for (const relativePath of skillFiles) {
      const metadata = parseFrontMatter(await fs.readFile(path.join(root, relativePath), "utf8"));
      expect(metadata, relativePath).not.toBeNull();
      expect(metadata, relativePath).toMatchObject({
        name: expect.any(String),
        description: expect.any(String)
      });
    }
  });

  it("keeps command-doc metadata aligned with the existing hforge command convention", async () => {
    const commandDocs = ["commands/hforge-double-diamond.md", "commands/hforge-bug-diamond.md"];
    const allowedStatuses = new Set(["draft", "stable", "deprecated"]);

    for (const relativePath of commandDocs) {
      const metadata = parseFrontMatter(await fs.readFile(path.join(root, relativePath), "utf8"));
      expect(metadata, relativePath).not.toBeNull();
      expect(metadata, relativePath).toMatchObject({
        kind: "command",
        title: expect.any(String),
        summary: expect.any(String),
        owner: expect.any(String),
        generated: "false"
      });
      expect(allowedStatuses.has(String(metadata?.status)), relativePath).toBe(true);
      expect(Array.isArray(metadata?.applies_to), relativePath).toBe(true);
      expect(metadata?.applies_to as string[], relativePath).toEqual(
        expect.arrayContaining(["codex", "claude-code"])
      );
    }
  });

  it("cross-links the two workflows so feature and bug paths stay separate", async () => {
    const feature = await fs.readFile(path.join(root, "skills/double-diamond-feature/SKILL.md"), "utf8");
    const bug = await fs.readFile(path.join(root, "skills/bug-investigation/SKILL.md"), "utf8");

    expect(feature).toContain("bug-investigation");
    expect(bug).toContain("double-diamond-feature");
  });
});
