import { describe, expect, it } from "vitest";

import { buildDecisionLog, renderDecisionLogMarkdown } from "../../src/application/runtime/render-decision-log.js";
import type { AsrRecord } from "../../src/domain/runtime/decision-record.js";

const record: AsrRecord = {
  id: "ASR-1",
  recordType: "asr",
  title: "Use runtime decision log",
  status: "accepted",
  reviewStatus: "approved",
  architectureSignificance: "medium",
  taskRefs: ["TASK-1"],
  requirementRefs: [],
  provenance: [],
  tags: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  summary: "Use generated decision log",
  problemStatement: "Need readable decision history",
  drivers: [],
  qualityAttributes: [],
  constraints: [],
  affectedModules: [],
  affectedFiles: [],
  risks: [],
  openQuestions: [],
  optionsToEvaluate: [],
  promotionCriteria: []
};

describe("decision log renderer", () => {
  it("builds stable entries and readable markdown", () => {
    const log = buildDecisionLog([record], [], "time-period", "2026-01-03T00:00:00.000Z");
    expect(log.entries[0]?.supersessionState).toBe("not-applicable");
    expect(renderDecisionLogMarkdown(log)).toContain("ASR-1: Use runtime decision log");
  });
});
