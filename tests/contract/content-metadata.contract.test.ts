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

describe("content metadata contract", () => {
  it("keeps required metadata on runtime markdown entrypoints", async () => {
    const files = [
      "commands/plan.md",
      "commands/test.md",
      "agents/planner.md",
      "contexts/dev.md",
      "rules/typescript/README.md",
      "docs/catalog/languages/typescript.md",
      "templates/tasks/implement-feature.md",
      "templates/workflows/research-plan-implement-validate.md"
    ];

    for (const relativePath of files) {
      const metadata = parseFrontMatter(await fs.readFile(path.join(root, relativePath), "utf8"));
      expect(metadata, relativePath).not.toBeNull();
      expect(metadata).toMatchObject({
        id: expect.any(String),
        kind: expect.any(String),
        title: expect.any(String),
        status: expect.any(String),
        owner: expect.any(String)
      });
    }
  });
});
