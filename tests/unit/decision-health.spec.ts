import { describe, expect, it } from "vitest";

import { deriveDecisionHealth } from "../../src/application/runtime/derive-decision-health.js";
import type { DecisionRecord } from "../../src/domain/runtime/decision-record.js";

const base = {
  recordType: "asr" as const,
  title: "Review retry orchestration",
  reviewStatus: "inferred" as const,
  architectureSignificance: "high" as const,
  taskRefs: ["TASK-1"],
  requirementRefs: [],
  provenance: [],
  tags: [],
  summary: "Retry orchestration",
  problemStatement: "Need durable retry behavior",
  drivers: [],
  qualityAttributes: [],
  constraints: [],
  affectedModules: [],
  affectedFiles: [],
  risks: [],
  optionsToEvaluate: [],
  promotionCriteria: []
};

describe("decision health", () => {
  it("flags stale proposed decisions and accepted decisions with unresolved follow-up context", () => {
    const decisions: DecisionRecord[] = [
      {
        ...base,
        id: "ASR-STALE",
        status: "proposed",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        openQuestions: []
      },
      {
        ...base,
        id: "ASR-ACCEPTED",
        status: "accepted",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        openQuestions: ["Confirm rollout owner."]
      }
    ];

    const findings = deriveDecisionHealth({
      decisions,
      now: new Date("2026-05-01T00:00:00.000Z")
    });

    expect(findings.map((finding) => finding.id)).toContain("decision-stale-proposed-ASR-STALE");
    expect(findings.map((finding) => finding.id)).toContain("decision-accepted-review-ASR-ACCEPTED");
  });
});
