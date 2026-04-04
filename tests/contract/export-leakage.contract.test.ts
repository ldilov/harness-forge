import { describe, expect, it } from "vitest";
import { detectExportLeakage } from "../../src/application/runtime/detect-export-leakage.js";

describe("export leakage contract", () => {
  it("flags exported blocked paths", () => {
    const leakage = detectExportLeakage(
      { profile: "kb-lean", include: ["AGENTS.md"], exclude: ["coverage"], requiredCanonicalPaths: [] },
      ["coverage/index.html", "AGENTS.md"]
    );
    expect(leakage.length).toBe(1);
  });
});
