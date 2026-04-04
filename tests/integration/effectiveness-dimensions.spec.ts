import { describe, expect, it } from "vitest";
import { scoreEffectivenessDimensions } from "../../src/application/runtime/score-effectiveness-dimensions.js";
import type { EffectivenessSignalRecord } from "../../src/infrastructure/observability/local-metrics-store.js";

function makeSignal(overrides: Partial<EffectivenessSignalRecord>): EffectivenessSignalRecord {
  return {
    signalType: "test",
    subjectId: "test",
    result: "success",
    recordedAt: new Date().toISOString(),
    ...overrides
  };
}

describe("effectiveness dimension scoring", () => {
  it("produces exactly 6 dimension scores", () => {
    const scores = scoreEffectivenessDimensions([]);
    expect(scores).toHaveLength(6);
    const ids = scores.map((s) => s.dimensionId);
    expect(ids).toContain("repoUnderstanding");
    expect(ids).toContain("targetCorrectness");
    expect(ids).toContain("runtimeAdoption");
    expect(ids).toContain("maintenanceHygiene");
    expect(ids).toContain("workContinuity");
    expect(ids).toContain("recommendationFollowThrough");
  });

  it("scores zero for empty signals", () => {
    const scores = scoreEffectivenessDimensions([]);
    for (const score of scores) {
      expect(score.score).toBe(0);
      expect(score.signalCount).toBe(0);
      expect(score.confidenceLevel).toBe("inferred-low");
    }
  });

  it("scores runtimeAdoption from runtimeUsage category signals", () => {
    const signals = [
      makeSignal({ category: "runtimeUsage", signalType: "review-executed" }),
      makeSignal({ category: "runtimeUsage", signalType: "review-executed" }),
      makeSignal({ category: "runtimeUsage", signalType: "review-executed" })
    ];
    const scores = scoreEffectivenessDimensions(signals);
    const adoption = scores.find((s) => s.dimensionId === "runtimeAdoption");
    expect(adoption).toBeDefined();
    expect(adoption!.signalCount).toBe(3);
    expect(adoption!.score).toBe(45); // 3 * 15
    expect(adoption!.confidenceLevel).toBe("inferred-high"); // > 2
  });

  it("caps score at 100", () => {
    const signals = Array.from({ length: 10 }, () =>
      makeSignal({ category: "maintenance", signalType: "doctor-executed" })
    );
    const scores = scoreEffectivenessDimensions(signals);
    const hygiene = scores.find((s) => s.dimensionId === "maintenanceHygiene");
    expect(hygiene!.score).toBe(100); // min(100, 10 * 15 = 150)
  });

  it("derives confidence from signal count", () => {
    const oneSignal = [makeSignal({ category: "recursive" })];
    const threeSignals = Array.from({ length: 3 }, () => makeSignal({ category: "recursive" }));
    const sixSignals = Array.from({ length: 6 }, () => makeSignal({ category: "recursive" }));

    const one = scoreEffectivenessDimensions(oneSignal).find((s) => s.dimensionId === "workContinuity");
    const three = scoreEffectivenessDimensions(threeSignals).find((s) => s.dimensionId === "workContinuity");
    const six = scoreEffectivenessDimensions(sixSignals).find((s) => s.dimensionId === "workContinuity");

    expect(one!.confidenceLevel).toBe("inferred-medium");
    expect(three!.confidenceLevel).toBe("inferred-high");
    expect(six!.confidenceLevel).toBe("direct");
  });

  it("scores recommendationFollowThrough only from accepted/success guidance", () => {
    const signals = [
      makeSignal({ category: "guidance", result: "accepted" }),
      makeSignal({ category: "guidance", result: "rejected" }),
      makeSignal({ category: "guidance", result: "success" })
    ];
    const scores = scoreEffectivenessDimensions(signals);
    const followThrough = scores.find((s) => s.dimensionId === "recommendationFollowThrough");
    expect(followThrough!.signalCount).toBe(2); // accepted + success, not rejected
  });
});
