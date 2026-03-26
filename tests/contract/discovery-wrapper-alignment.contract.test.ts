import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("enhanced wrapper alignment scaffolding", () => {
  it("tracks every imported wrapper against a canonical destination", async () => {
    const inventory = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "catalog", "enhanced-skill-import-inventory.json"), "utf8")
    ) as {
      entries: Array<{
        skillId: string | null;
        resourceType: string;
        destinationPath: string;
        reviewStatus: string;
      }>;
    };

    const wrapperEntries = inventory.entries.filter((entry) => entry.resourceType === "wrapper");
    expect(wrapperEntries).toHaveLength(10);

    for (const entry of wrapperEntries) {
      expect(entry.skillId).toBeTruthy();
      expect(entry.destinationPath).toBe(`.agents/skills/${entry.skillId}/SKILL.md`);
      expect(entry.reviewStatus).toBe("accepted");

      const absolutePath = path.join(root, entry.destinationPath);
      const content = await fs.readFile(absolutePath, "utf8");
      expect(content).toContain(`skills/${entry.skillId}/SKILL.md`);
      expect(content).toContain("docs/authoring/enhanced-skill-import.md");
      expect(content).toContain("RESEARCH-SOURCES.md");
      expect(content).toContain("VALIDATION.md");
    }
  });
});
