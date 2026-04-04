import { describe, expect, it } from "vitest";
import { runRuntimeGates } from "../../src/application/runtime/run-runtime-gates.js";

describe("runtime governance gates integration", () => {
  it("returns all configured gate checks", () => {
    const results = runRuntimeGates({
      hotPathWithinBudget: true,
      canonicalityComplete: true,
      duplicateThresholdPass: true,
      bridgeBudgetPass: true,
      leakagePass: true,
      outputCoveragePass: true,
      targetHonestyPass: true
    });
    expect(results.length).toBe(7);
  });
});
