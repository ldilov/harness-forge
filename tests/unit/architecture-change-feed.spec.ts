import { describe, expect, it } from "vitest";

import { buildArchitectureChangeFeed, filterArchitectureChangeFeed } from "../../src/application/runtime/build-architecture-change-feed.js";
import type { AsrRecord } from "../../src/domain/runtime/decision-record.js";

const record: AsrRecord = {
  id: "ASR-1",
  recordType: "asr",
  title: "Use architecture feed",
  status: "accepted",
  reviewStatus: "approved",
  architectureSignificance: "high",
  taskRefs: ["TASK-1"],
  requirementRefs: [],
  provenance: [],
  tags: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
  summary: "Use feed",
  problemStatement: "Need chronological context",
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

describe("architecture change feed", () => {
  it("builds deterministic decision entries and supports decision filtering", () => {
    const feed = buildArchitectureChangeFeed({ decisions: [record] });
    expect(feed.map((entry) => entry.id)).toEqual(["decision-updated-ASR-1", "decision-created-ASR-1"]);
    expect(filterArchitectureChangeFeed(feed, "decisions")).toHaveLength(2);
  });
});
