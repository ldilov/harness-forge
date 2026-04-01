import { describe, expect, it } from "vitest";

import { parseRecursiveWorkingMemory } from "../../src/domain/recursive/memory.js";
import { parseRecursiveFinalOutput } from "../../src/domain/recursive/final-output.js";

describe("recursive memory contract", () => {
  it("distinguishes durable working memory from final outputs", () => {
    const memory = parseRecursiveWorkingMemory({
      memoryId: "MEM-001",
      sessionId: "RS-001",
      currentObjective: "Inspect billing retries",
      currentPlan: ["Read repo map"],
      filesInFocus: ["repo-map"],
      confirmedFacts: ["repo map inspected"],
      inferredFacts: [],
      blockers: [],
      openQuestions: [],
      recentFailedAttempts: [],
      scratchRefs: [],
      nextStep: "Finalize the result",
      updatedAt: "2026-04-01T10:00:00.000Z"
    });
    const output = parseRecursiveFinalOutput({
      outputId: "OUT-001",
      sessionId: "RS-001",
      status: "finalized",
      summary: "Done",
      sections: [],
      artifactRefs: [],
      promotionRefs: [],
      terminalVerdict: "completed",
      generatedAt: "2026-04-01T10:00:01.000Z"
    });

    expect(memory.confirmedFacts).toEqual(["repo map inspected"]);
    expect(output.status).toBe("finalized");
  });

});
