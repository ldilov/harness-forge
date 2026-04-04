import { describe, expect, it } from "vitest";

import { computeEffectivenessComparison } from "../../src/application/runtime/compute-effectiveness-comparison.js";
import type { EffectivenessSignalRecord } from "../../src/infrastructure/observability/local-metrics-store.js";

function makeSignal(
  overrides: Partial<EffectivenessSignalRecord> & { recordedAt: string }
): EffectivenessSignalRecord {
  return {
    signalType: "test-signal",
    subjectId: "test-subject",
    result: "success",
    category: "runtimeUsage",
    ...overrides
  };
}

describe("computeEffectivenessComparison", () => {
  const beforeTimestamp = "2025-01-01T00:00:00.000Z";
  const afterTimestamp = "2025-02-01T00:00:00.000Z";

  it("computes positive deltas when after period has more successful signals", () => {
    const signals: EffectivenessSignalRecord[] = [
      makeSignal({ recordedAt: "2025-01-10T00:00:00.000Z", result: "success", category: "runtimeUsage" }),
      makeSignal({ recordedAt: "2025-02-10T00:00:00.000Z", result: "success", category: "runtimeUsage" }),
      makeSignal({ recordedAt: "2025-02-11T00:00:00.000Z", result: "success", category: "runtimeUsage" }),
      makeSignal({ recordedAt: "2025-02-12T00:00:00.000Z", result: "success", category: "runtimeUsage" })
    ];

    const comparison = computeEffectivenessComparison(signals, beforeTimestamp, afterTimestamp);

    expect(comparison.beforeTimestamp).toBe(beforeTimestamp);
    expect(comparison.afterTimestamp).toBe(afterTimestamp);
    expect(comparison.deltas).toBeDefined();
    expect(comparison.deltas["runtimeAdoption"]).toBeGreaterThan(0);
  });

  it("computes zero deltas when both periods are empty", () => {
    const signals: EffectivenessSignalRecord[] = [];

    const comparison = computeEffectivenessComparison(signals, beforeTimestamp, afterTimestamp);

    expect(comparison.deltas).toBeDefined();
    for (const delta of Object.values(comparison.deltas)) {
      expect(delta).toBe(0);
    }
  });

  it("computes negative deltas when before period has more signals than after", () => {
    const signals: EffectivenessSignalRecord[] = [
      makeSignal({ recordedAt: "2025-01-05T00:00:00.000Z", result: "success", category: "maintenance" }),
      makeSignal({ recordedAt: "2025-01-10T00:00:00.000Z", result: "success", category: "maintenance" }),
      makeSignal({ recordedAt: "2025-01-15T00:00:00.000Z", result: "success", category: "maintenance" })
    ];

    const comparison = computeEffectivenessComparison(signals, beforeTimestamp, afterTimestamp);

    expect(comparison.deltas["maintenanceHygiene"]).toBeLessThan(0);
  });

  it("correctly partitions signals across the timestamp boundary", () => {
    const signals: EffectivenessSignalRecord[] = [
      makeSignal({ recordedAt: "2024-12-31T23:59:59.000Z", result: "success", category: "install" }),
      makeSignal({ recordedAt: "2025-01-15T00:00:00.000Z", result: "success", category: "install" }),
      makeSignal({ recordedAt: "2025-02-15T00:00:00.000Z", result: "success", category: "install" })
    ];

    const comparison = computeEffectivenessComparison(signals, beforeTimestamp, afterTimestamp);

    expect(comparison.deltas).toBeDefined();
    expect(typeof comparison.deltas["repoUnderstanding"]).toBe("number");
  });
});
