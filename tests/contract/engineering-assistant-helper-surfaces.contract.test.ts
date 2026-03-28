import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("engineering assistant helper-surface governance", () => {
  it("records reusable helper-surface plans with failure guidance", async () => {
    const inventory = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "catalog", "engineering-assistant-import-inventory.json"), "utf8")
    ) as {
      helperSurfaces: Array<{
        helperId: string;
        sourceArtifact: string;
        surfaceType: string;
        purpose: string;
        destinationPath: string;
        targetCoverage: string[];
        failureMode: string;
      }>;
    };

    expect(inventory.helperSurfaces.map((entry) => entry.helperId)).toEqual(
      expect.arrayContaining([
        "engineering-assistant-project-notes",
        "engineering-assistant-change-discipline"
      ])
    );

    for (const helper of inventory.helperSurfaces) {
      expect(helper.surfaceType).toBe("documentation-plan");
      expect(helper.purpose.length).toBeGreaterThan(25);
      expect(helper.targetCoverage).toEqual(
        expect.arrayContaining(["codex", "claude-code", "cursor", "opencode"])
      );
      expect(helper.failureMode.length).toBeGreaterThan(20);
      await expect(fs.readFile(path.join(root, helper.destinationPath), "utf8")).resolves.toBeTruthy();
    }
  });
});
