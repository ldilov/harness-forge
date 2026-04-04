import { describe, expect, it } from "vitest";
import { detectExportLeakage } from "../../src/application/runtime/detect-export-leakage.js";


describe("kb-lean export integration", () => {
  it("detects blocked leakage paths", () => {
    const leakage = detectExportLeakage(
      { profile: "kb-lean", include: ["AGENTS.md"], exclude: ["tests"], requiredCanonicalPaths: [] },
      ["tests/a.spec.ts"]
    );
    expect(leakage).toHaveLength(1);
  });
});
