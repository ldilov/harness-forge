import { describe, expect, it } from "vitest";

import { evaluateDecisionCoverage } from "../../src/application/runtime/evaluate-decision-coverage.js";
import type { TaskPack } from "../../src/domain/runtime/task-pack.js";

function task(level: "low" | "medium" | "high" | "critical", decisionRefs: string[] = []): TaskPack {
  return {
    taskId: `TASK-${level}`,
    title: `Task ${level}`,
    generatedAt: "2026-01-01T00:00:00.000Z",
    summary: "summary",
    architectureSignificance: {
      taskId: `TASK-${level}`,
      level,
      signals: ["signal"],
      sourceRefs: [],
      confidence: "high",
      reviewStatus: "inferred",
      assessedAt: "2026-01-01T00:00:00.000Z",
      assessedBy: "test"
    },
    decisionRefs,
    asrRefs: [],
    adrRefs: [],
    requirements: [],
    implementationNotes: [],
    selectedTemplates: [],
    reviewStatus: "inferred"
  };
}

describe("decision coverage", () => {
  it("blocks high-significance tasks without decision evidence", () => {
    const [result] = evaluateDecisionCoverage([task("high")], []);
    expect(result?.classification).toBe("missing-coverage");
    expect(result?.severity).toBe("blocker");
  });

  it("treats low-significance tasks as not required", () => {
    const [result] = evaluateDecisionCoverage([task("low")], []);
    expect(result?.classification).toBe("not-required");
  });
});
