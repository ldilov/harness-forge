import { describe, it, expect } from "vitest";
import { parseEvidenceItem, parseLanguageSignal } from "../../src/domain/shared/evidence-item.js";

describe("evidence item contract", () => {
  it("parses valid evidence item", () => {
    const valid = {
      id: "ev1",
      label: "package.json",
      path: "package.json",
      signalType: "tooling-signal",
      summary: "npm package metadata present",
      confidence: 0.9,
    };
    const result = parseEvidenceItem(valid);
    expect(result.id).toBe("ev1");
    expect(result.signalType).toBe("tooling-signal");
  });

  it("rejects invalid signalType", () => {
    const invalid = {
      id: "ev1",
      label: "test",
      signalType: "invalid-type",
      summary: "test",
    };
    expect(() => parseEvidenceItem(invalid)).toThrow();
  });

  it("rejects summary over 120 chars", () => {
    const invalid = {
      id: "ev1",
      label: "test",
      signalType: "tooling-signal",
      summary: "a".repeat(121),
    };
    expect(() => parseEvidenceItem(invalid)).toThrow();
  });

  it("parses valid language signal", () => {
    const valid = { language: "TypeScript", strength: "high" };
    const result = parseLanguageSignal(valid);
    expect(result.language).toBe("TypeScript");
    expect(result.strength).toBe("high");
  });

  it("rejects invalid strength", () => {
    expect(() => parseLanguageSignal({ language: "Go", strength: "very-high" })).toThrow();
  });
});
