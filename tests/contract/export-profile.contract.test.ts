import { describe, expect, it } from "vitest";
import { parseExportProfileManifest } from "../../src/domain/runtime/export-profile.js";

describe("export profile contract", () => {
  it("parses include and exclude lists", () => {
    const manifest = parseExportProfileManifest({
      profile: "kb-lean",
      include: ["AGENTS.md"],
      exclude: ["coverage"],
      requiredCanonicalPaths: [".hforge/runtime/authority-map.json"]
    });
    expect(manifest.profile).toBe("kb-lean");
  });
});
