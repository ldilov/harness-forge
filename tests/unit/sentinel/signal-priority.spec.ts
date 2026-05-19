import { describe, expect, it } from "vitest";

import { computePriority } from "../../../src/domain/sentinel/signal/priority.js";

describe("computePriority", () => {
  it("ranks critical above warning above notice above info for the same other inputs", () => {
    const base = { confidence: 1, occurrenceCount: 1, ageMs: 0 };
    expect(computePriority({ severity: "critical", ...base })).toBeGreaterThan(
      computePriority({ severity: "warning", ...base }),
    );
    expect(computePriority({ severity: "warning", ...base })).toBeGreaterThan(
      computePriority({ severity: "notice", ...base }),
    );
    expect(computePriority({ severity: "notice", ...base })).toBeGreaterThan(
      computePriority({ severity: "info", ...base }),
    );
  });

  it("rewards higher confidence", () => {
    const a = computePriority({ severity: "warning", confidence: 0.2, occurrenceCount: 1, ageMs: 0 });
    const b = computePriority({ severity: "warning", confidence: 0.9, occurrenceCount: 1, ageMs: 0 });
    expect(b).toBeGreaterThan(a);
  });

  it("rewards recurrence (more occurrences raise priority)", () => {
    const a = computePriority({ severity: "warning", confidence: 1, occurrenceCount: 1, ageMs: 0 });
    const b = computePriority({ severity: "warning", confidence: 1, occurrenceCount: 8, ageMs: 0 });
    expect(b).toBeGreaterThan(a);
  });

  it("decays for older observations", () => {
    const fresh = computePriority({ severity: "warning", confidence: 1, occurrenceCount: 1, ageMs: 60_000 });
    const oldish = computePriority({
      severity: "warning",
      confidence: 1,
      occurrenceCount: 1,
      ageMs: 30 * 24 * 3_600_000,
    });
    expect(fresh).toBeGreaterThan(oldish);
  });

  it("clamps the result to [0, 100]", () => {
    const value = computePriority({ severity: "critical", confidence: 1, occurrenceCount: 1024, ageMs: 0 });
    expect(value).toBeGreaterThanOrEqual(0);
    expect(value).toBeLessThanOrEqual(100);
  });
});
