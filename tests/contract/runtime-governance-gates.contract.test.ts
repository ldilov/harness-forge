import { describe, expect, it } from "vitest";
import { runRuntimeGates } from "../../src/application/runtime/run-runtime-gates.js";

describe("runtime governance gates", () => {
  it("returns fail when critical checks fail", () => {
    const result = runRuntimeGates({
      hotPathWithinBudget: true,
      canonicalityComplete: false,
      duplicateThresholdPass: true,
      bridgeBudgetPass: true,
      leakagePass: true,
      outputCoveragePass: true,
      targetHonestyPass: true
    });
    expect(result.find((entry) => entry.gateId === "canonicality")?.status).toBe("fail");
  });
});
