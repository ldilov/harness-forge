import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("engineering assistant runtime-port baseline", () => {
  it("keeps the MVP slice honest about runtime support", async () => {
    const inventory = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "catalog", "engineering-assistant-import-inventory.json"), "utf8")
    ) as {
      compatibilityProfiles: Array<{ targetId: string; supportLevel: string; notes: string }>;
    };
    const portDoc = await fs.readFile(path.join(root, "docs", "authoring", "engineering-assistant-port.md"), "utf8");

    expect(inventory.compatibilityProfiles).toHaveLength(4);
    expect(inventory.compatibilityProfiles.some((entry) => entry.supportLevel === "guidance-only")).toBe(true);
    expect(portDoc).toContain("Codex");
    expect(portDoc).toContain("Claude Code");
    expect(portDoc).toContain("Cursor");
    expect(portDoc).toContain("OpenCode");
    expect(portDoc).toContain("does not claim runtime-native parity");
  });
});
