import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const inventoryPath = path.join(root, "manifests", "catalog", "engineering-assistant-import-inventory.json");

describe("engineering assistant port inventory", () => {
  it("records an explicit decision for every imported archive artifact", async () => {
    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as {
      packId: string;
      sourceName: string;
      entries: Array<{
        artifactPath: string;
        artifactType: string;
        decision: string;
        decisionReason: string;
        destinationPath: string;
        reviewStatus: string;
      }>;
      helperSurfaces: Array<{ helperId: string }>;
      compatibilityProfiles: Array<{ targetId: string }>;
    };

    expect(inventory.packId).toBe("engineering-assistant-2026-03");
    expect(inventory.sourceName).toContain("Engineering Assistant");
    expect(inventory.entries).toHaveLength(9);
    expect(inventory.helperSurfaces).toHaveLength(2);
    expect(inventory.compatibilityProfiles).toHaveLength(4);

    for (const entry of inventory.entries) {
      expect(entry.artifactPath).toBeTruthy();
      expect(entry.artifactType).toMatch(/^(skill|reference|notes|changelog|script|metadata)$/);
      expect(entry.decision).toMatch(/^(embed|adapt|translate|provenance-only|exclude)$/);
      expect(entry.decisionReason.length).toBeGreaterThan(20);
      expect(entry.destinationPath).toBeTruthy();
      expect(entry.reviewStatus).toBe("accepted");
    }
  });

  it("keeps imported notes, changelog, scripts, and metadata traceable through project-owned surfaces", async () => {
    const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8")) as {
      entries: Array<{
        artifactPath: string;
        artifactType: string;
        destinationPath: string;
      }>;
    };

    const trackedArtifactPaths = [
      "engineering-assistant/PROJECT_NOTES.md",
      "engineering-assistant/CHANGELOG.md",
      "engineering-assistant/scripts/project_notes.py",
      "engineering-assistant/scripts/change_log.py",
      "engineering-assistant/agents/openai.yaml"
    ];

    expect(inventory.entries.map((entry) => entry.artifactPath)).toEqual(
      expect.arrayContaining(trackedArtifactPaths)
    );

    for (const entry of inventory.entries.filter((item) => trackedArtifactPaths.includes(item.artifactPath))) {
      await expect(fs.readFile(path.join(root, entry.destinationPath), "utf8")).resolves.toBeTruthy();
    }
  });
});
