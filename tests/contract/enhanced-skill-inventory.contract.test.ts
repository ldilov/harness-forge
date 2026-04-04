import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const inventoryPath = path.join(root, "manifests", "catalog", "enhanced-skill-import-inventory.json");

describe("enhanced skill import inventory", () => {
  it("records explicit outcomes for the imported pack", async () => {
    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as {
      packId: string;
      sourceName: string;
      entries: Array<{
        resourcePath: string;
        resourceType: string;
        skillId: string | null;
        decision: string;
        decisionReason: string;
        destinationPath: string;
        reviewStatus: string;
      }>;
      embeddingRules: Array<{ ruleId: string }>;
    };

    expect(inventory.packId).toBe("enhanced-skills-2026-03");
    expect(inventory.sourceName).toContain("Enhanced Skills Pack");
    expect(inventory.embeddingRules.length).toBeGreaterThanOrEqual(4);

    for (const entry of inventory.entries) {
      expect(entry.resourcePath).toBeTruthy();
      expect(entry.resourceType).toMatch(/^(skill|wrapper|reference|provenance|script)$/);
      expect(entry.decision).toMatch(/^(merge|promote|provenance-only|unchanged|excluded)$/);
      expect(entry.decisionReason.length).toBeGreaterThan(20);
      expect(entry.destinationPath).toBeTruthy();
      expect(entry.reviewStatus).toMatch(/^(pending|accepted|rejected)$/);
    }
  });

  it("accepts all canonical skill and reference merges for the MVP slice", async () => {
    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as {
      entries: Array<{
        skillId: string | null;
        resourceType: string;
        destinationPath: string;
        reviewStatus: string;
      }>;
    };

    const acceptedSkillIds = [
      "repo-onboarding",
      "architecture-decision-records",
      "api-contract-review",
      "db-migration-review",
      "parallel-worktree-supervisor",
      "repo-modernization",
      "typescript-engineering",
      "lua-engineering",
      "javascript-engineering"
    ];

    for (const skillId of acceptedSkillIds) {
      const skillEntry = inventory.entries.find(
        (entry) => entry.skillId === skillId && entry.resourceType === "skill"
      );
      const referenceEntry = inventory.entries.find(
        (entry) => entry.skillId === skillId && entry.resourceType === "reference"
      );

      expect(skillEntry?.reviewStatus).toBe("accepted");
      expect(referenceEntry?.reviewStatus).toBe("accepted");
      await expect(fs.readFile(path.join(root, skillEntry!.destinationPath), "utf8")).resolves.toBeTruthy();
      await expect(
        fs.stat(path.join(root, referenceEntry!.destinationPath.replaceAll("/", path.sep)))
      ).resolves.toBeTruthy();
    }
  });

  it("preserves pack provenance in a maintainer-facing document", async () => {
    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as {
      entries: Array<{
        resourcePath: string;
        resourceType: string;
        destinationPath: string;
        decision: string;
      }>;
    };
    const provenanceDoc = await fs.readFile(
      path.join(root, "docs", "authoring", "enhanced-skill-import.md"),
      "utf8"
    );

    const provenanceEntries = inventory.entries.filter((entry) => entry.resourceType === "provenance");
    expect(provenanceEntries.map((entry) => entry.resourcePath)).toEqual(
      expect.arrayContaining(["README.md", "VALIDATION.md", "RESEARCH-SOURCES.md"])
    );
    for (const entry of provenanceEntries) {
      expect(entry.decision).toBe("provenance-only");
    }
    expect(provenanceEntries.map((entry) => entry.destinationPath)).toEqual(
      expect.arrayContaining([
        "docs/authoring/enhanced-skill-import.md",
        "RESEARCH-SOURCES.md",
        "VALIDATION.md"
      ])
    );

    expect(provenanceDoc).toContain("Harness Forge Enhanced Skills Pack");
    expect(provenanceDoc).toContain("validate-skill-depth");
    expect(provenanceDoc).toContain("OpenAPI");
  });
});
