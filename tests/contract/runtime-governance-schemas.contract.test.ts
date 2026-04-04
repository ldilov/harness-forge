import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("runtime governance schemas", () => {
  it("ships runtime-native governance schema files", async () => {
    const required = [
      "schemas/runtime/authority-map.schema.json",
      "schemas/runtime/context-budget.schema.json",
      "schemas/runtime/surface-tiers.schema.json",
      "schemas/runtime/output-policy.schema.json",
      "schemas/runtime/duplicate-inventory.schema.json",
      "schemas/runtime/export-profile-manifest.schema.json",
      "schemas/runtime/target-adapter.schema.json"
    ];
    await Promise.all(required.map(async (relative) => {
      const file = path.join(root, relative);
      const content = await fs.readFile(file, "utf8");
      expect(content.length).toBeGreaterThan(0);
    }));
  });
});
