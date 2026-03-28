import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("engineering assistant compatibility governance", () => {
  it("records explicit support modes and fallback notes for each target", async () => {
    const inventory = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "catalog", "engineering-assistant-import-inventory.json"), "utf8")
    ) as {
      compatibilityProfiles: Array<{
        targetId: string;
        supportLevel: string;
        metadataMode: string;
        hookMode: string;
        helperMode: string;
        notes: string;
        currentSurfaces: string[];
      }>;
    };

    expect(inventory.compatibilityProfiles.map((entry) => entry.targetId)).toEqual(
      expect.arrayContaining(["codex", "claude-code", "cursor", "opencode"])
    );

    for (const profile of inventory.compatibilityProfiles) {
      expect(profile.supportLevel).toMatch(/^(translated|guidance-only|full|partial)$/);
      expect(profile.metadataMode).toMatch(/^(translated|unsupported|native)$/);
      expect(profile.hookMode).toMatch(/^(manual|documentation-only|native|translated)$/);
      expect(profile.helperMode).toMatch(/^(documentation-only|packaged-helper|native-command)$/);
      expect(profile.notes.length).toBeGreaterThan(40);
      expect(profile.currentSurfaces.length).toBeGreaterThanOrEqual(1);

      for (const surface of profile.currentSurfaces) {
        await expect(fs.readFile(path.join(root, surface), "utf8")).resolves.toBeTruthy();
      }
    }
  });

  it("extends hook governance with fallback guidance fields", async () => {
    const schema = JSON.parse(await fs.readFile(path.join(root, "schemas", "hooks", "hook.schema.json"), "utf8")) as {
      properties: Record<string, unknown>;
    };
    const manifest = JSON.parse(await fs.readFile(path.join(root, "manifests", "hooks", "index.json"), "utf8")) as {
      hooks: Array<{ id: string; fallbackGuidance?: string; workflowFamilies?: string[] }>;
    };
    const hookDocs = await fs.readFile(path.join(root, "docs", "hooks", "catalog.md"), "utf8");

    expect(schema.properties).toHaveProperty("fallbackGuidance");
    expect(schema.properties).toHaveProperty("workflowFamilies");

    for (const hook of manifest.hooks) {
      expect(hook.fallbackGuidance).toBeTruthy();
      expect(hook.workflowFamilies).toBeDefined();
      expect(hook.workflowFamilies?.length).toBeGreaterThan(0);
    }

    expect(hookDocs).toContain("native, translated, manual, or documentation-only");
    expect(hookDocs).toContain("engineering-assistant");
  });
});
