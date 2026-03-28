import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("repo intelligence language weighting", () => {
  it("treats lua project content as dominant over helper python scripts and claude hook shells", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-language-weighting-"));
    tempRoots.push(workspaceRoot);

    const filesToWrite = new Map<string, string>([
      ["seed/MetricThresholds.lua", "return { crit = 100 }\n"],
      ["seed/Abilities.lua", "return { whirlwind = true }\n"],
      ["seed/EnemyProfiles.lua", "return { boss = true }\n"],
      ["data/SeasonOverrides.lua", "return { season = 's1' }\n"],
      ["scripts/fetch_blizzard_data.py", "print('fetch')\n"],
      ["scripts/fetch_counter_data.py", "print('fetch')\n"],
      [".claude/hooks/post-tool-use.sh", "echo post\n"],
      [".claude/hooks/pre-tool-use.sh", "echo pre\n"],
      ["AGENTS.md", "# agent guidance\n"],
      ["CLAUDE.md", "# claude guidance\n"]
    ]);

    for (const [relativePath, content] of filesToWrite) {
      const absolutePath = path.join(workspaceRoot, relativePath);
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, content, "utf8");
    }

    const { collectRepoFacts } = await import("../../scripts/intelligence/shared.mjs");
    const facts = await collectRepoFacts(workspaceRoot);

    expect(facts.dominantLanguages[0]?.id).toBe("lua");
    expect(facts.dominantLanguages.map((entry: { id: string }) => entry.id)).toContain("python");
    expect(facts.dominantLanguages.map((entry: { id: string }) => entry.id)).not.toContain("shell");
    expect(facts.dominantLanguages[0]?.evidence).toEqual(
      expect.arrayContaining(["seed/MetricThresholds.lua", "seed/Abilities.lua"])
    );
  });
});
