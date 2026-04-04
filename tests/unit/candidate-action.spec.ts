import { describe, it, expect } from "vitest";
import { scoringHintsSchema } from "../../src/domain/next/candidate-action.js";

describe("candidate-action schemas", () => {
  it("parses valid scoring hints", () => {
    const valid = {
      urgencyBase: 0.7,
      healthImpactBase: 0.5,
      effortReductionBase: 0.6,
      reversibilityBase: 0.9,
    };
    const result = scoringHintsSchema.parse(valid);
    expect(result.urgencyBase).toBe(0.7);
  });

  it("rejects scoring hints with value > 1", () => {
    const invalid = {
      urgencyBase: 1.5,
      healthImpactBase: 0.5,
      effortReductionBase: 0.6,
      reversibilityBase: 0.9,
    };
    expect(() => scoringHintsSchema.parse(invalid)).toThrow();
  });

  it("rejects scoring hints with value < 0", () => {
    const invalid = {
      urgencyBase: -0.1,
      healthImpactBase: 0.5,
      effortReductionBase: 0.6,
      reversibilityBase: 0.9,
    };
    expect(() => scoringHintsSchema.parse(invalid)).toThrow();
  });

  it("rejects missing fields", () => {
    const invalid = { urgencyBase: 0.5 };
    expect(() => scoringHintsSchema.parse(invalid)).toThrow();
  });
});
