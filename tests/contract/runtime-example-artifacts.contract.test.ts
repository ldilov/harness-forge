import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("runtime example artifacts", () => {
  it("ships all example artifacts", async () => {
    const root = process.cwd();
    const required = [
      "docs/runtime/examples/authority-map.example.json",
      "docs/runtime/examples/context-budget.example.json",
      "docs/runtime/examples/output-policy.example.json",
      "docs/runtime/examples/duplicate-inventory.example.json",
      "docs/runtime/examples/target-adapter.example.json",
      "docs/runtime/examples/export-kb-lean.example.json"
    ];
    await Promise.all(required.map(async (relative) => {
      const content = await fs.readFile(path.join(root, relative), "utf8");
      expect(content.length).toBeGreaterThan(0);
    }));
  });
});
