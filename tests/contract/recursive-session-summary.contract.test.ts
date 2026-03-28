import { describe, expect, it } from "vitest";

import { parseRecursiveSessionSummary } from "../../src/domain/recursive/session-summary.js";

describe("recursive session summary contract", () => {
  it("parses the deterministic recursive summary shape", () => {
    const summary = parseRecursiveSessionSummary({
      sessionId: "RS-001",
      taskId: "TASK-REC-001",
      outcome: "draft",
      summary: "Draft recursive session created.",
      promotedArtifacts: [],
      outstandingGaps: ["Evidence gathering not started."],
      budgetReport: {
        policyId: "default-recursive-policy",
        limitsHit: []
      },
      followUp: "Inspect the linked task artifacts.",
      generatedAt: "2026-03-27T10:00:00.000Z"
    });

    expect(summary.outcome).toBe("draft");
  });
});
