import { describe, expect, it } from "vitest";
import { verifyTargetSupportMode } from "../../src/application/runtime/verify-target-support-mode.js";

describe("target support honesty integration", () => {
  it("flags invalid native posture", () => {
    const verdict = verifyTargetSupportMode({
      targetId: "x",
      declaredMode: "native",
      observedSupportsHooks: false,
      observedSupportsCommands: false
    });
    expect(verdict.consistent).toBe(false);
  });
});
