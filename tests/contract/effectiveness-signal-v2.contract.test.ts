import { describe, expect, it } from "vitest";
import { effectivenessSignalV2Schema, parseEffectivenessSignalV2 } from "../../src/domain/runtime/effectiveness-signal.js";

describe("effectiveness-signal-v2 contract", () => {
  it("parses old signals without category or confidenceLevel", () => {
    const oldSignal = {
      signalType: "doctor-run",
      subjectId: "doctor",
      result: "success",
      recordedAt: "2026-04-03T12:00:00Z"
    };
    const parsed = parseEffectivenessSignalV2(oldSignal);
    expect(parsed.signalType).toBe("doctor-run");
    expect(parsed.category).toBeUndefined();
    expect(parsed.confidenceLevel).toBeUndefined();
  });

  it("parses new signals with category and confidenceLevel", () => {
    const newSignal = {
      signalType: "review-executed",
      subjectId: "review",
      result: "success",
      recordedAt: "2026-04-03T12:00:00Z",
      category: "runtimeUsage",
      confidenceLevel: "direct"
    };
    const parsed = parseEffectivenessSignalV2(newSignal);
    expect(parsed.category).toBe("runtimeUsage");
    expect(parsed.confidenceLevel).toBe("direct");
  });

  it("rejects invalid category values", () => {
    const bad = {
      signalType: "test",
      subjectId: "test",
      result: "success",
      recordedAt: "2026-04-03T12:00:00Z",
      category: "invalid-category"
    };
    expect(() => effectivenessSignalV2Schema.parse(bad)).toThrow();
  });

  it("rejects invalid confidenceLevel values", () => {
    const bad = {
      signalType: "test",
      subjectId: "test",
      result: "success",
      recordedAt: "2026-04-03T12:00:00Z",
      confidenceLevel: "maybe"
    };
    expect(() => effectivenessSignalV2Schema.parse(bad)).toThrow();
  });

  it("accepts all valid category values", () => {
    const categories = ["install", "firstRun", "guidance", "runtimeUsage", "maintenance", "recursive", "handoff", "outcomes", "heuristics"];
    for (const category of categories) {
      const signal = {
        signalType: "test",
        subjectId: "test",
        result: "success",
        recordedAt: "2026-04-03T12:00:00Z",
        category
      };
      expect(() => effectivenessSignalV2Schema.parse(signal)).not.toThrow();
    }
  });
});
