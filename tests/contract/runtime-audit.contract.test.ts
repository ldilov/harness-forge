import { describe, expect, it } from "vitest";
import { summarizeRuntimeReview } from "../../src/application/runtime/review-workspace.js";

describe("runtime audit contract", () => {
  it("returns warn/changes-requested when findings exist", () => {
    const summary = summarizeRuntimeReview([{ id: "1", title: "Issue", severity: "high", evidence: [] }]);
    expect(["warn", "changes-requested"]).toContain(summary.verdict);
  });
});
