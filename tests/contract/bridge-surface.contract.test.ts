import { describe, expect, it } from "vitest";
import { analyzeBridgeSurface } from "../../src/application/runtime/analyze-bridge-surfaces.js";

describe("bridge surface contract", () => {
  it("requires canonical pointers and token budget compliance", () => {
    const analysis = analyzeBridgeSurface("AGENTS.md", "Use .hforge/runtime/index.json", 1000);
    expect(analysis.hasCanonicalPointer).toBe(true);
    expect(analysis.withinBudget).toBe(true);
  });
});
