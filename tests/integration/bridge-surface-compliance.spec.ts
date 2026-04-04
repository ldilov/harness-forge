import { describe, expect, it } from "vitest";
import { analyzeBridgeSurface } from "../../src/application/runtime/analyze-bridge-surfaces.js";

describe("bridge surface compliance integration", () => {
  it("flags missing canonical pointers", () => {
    const analysis = analyzeBridgeSurface("bridge.md", "no pointers here", 500);
    expect(analysis.hasCanonicalPointer).toBe(false);
  });
});
