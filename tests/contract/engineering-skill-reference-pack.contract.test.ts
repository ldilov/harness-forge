import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

const requiredFiles = [
  "skills/typescript-engineering/references/type-system-patterns.md",
  "skills/lua-engineering/references/game-and-addon-patterns.md",
  "skills/powershell-engineering/references/remoting-and-ops.md",
  "skills/python-engineering/references/ecosystem-guide.md",
  "skills/javascript-engineering/SKILL.md",
  ".agents/skills/javascript-engineering/SKILL.md",
  "skills/cloud-architect/SKILL.md",
  ".agents/skills/cloud-architect/SKILL.md"
];

describe("engineering skill reference packs", () => {
  it("ships imported reference packs and discovery wrappers", async () => {
    await Promise.all(requiredFiles.map(async (relativePath) => expect(await fs.readFile(path.join(root, relativePath), "utf8")).toBeTruthy()));
  });
});
