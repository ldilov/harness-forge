import { describe, expect, it } from "vitest";

import { parseRecursiveExecutionPolicy } from "../../src/domain/recursive/execution-policy.js";

describe("recursive policy contract", () => {
  it("parses explicit recursive RLM policy posture", () => {
    const policy = parseRecursiveExecutionPolicy({
      policyId: "default-recursive-policy",
      sessionId: "RS-001",
      isolationLevel: "read-only-inspection",
      policyLevel: "typed-rlm",
      allowStructuredRun: true,
      allowTypedActions: true,
      allowCodeCells: true,
      allowMetaOps: true,
      allowPromotions: true,
      allowedInputs: ["file", "stdin"],
      restrictedBehaviors: ["network"],
      allowedOperationFamilies: ["read-handle", "run-code-cell"],
      allowedLanguages: ["javascript"],
      allowedWriteScopes: ["scratch", "proposal-artifacts"],
      networkPosture: "offline",
      stopConditions: ["budget exhausted"],
      budgetSummary: {
        maxDurationMs: 1000,
        maxRuns: 3,
        maxIterations: 4,
        maxSubcalls: 2,
        maxCodeCells: 1,
        notes: "typed-rlm only"
      },
      createdAt: "2026-04-01T10:00:00.000Z",
      updatedAt: "2026-04-01T10:00:00.000Z"
    });

    expect(policy.allowedOperationFamilies).toContain("run-code-cell");
  });

});
