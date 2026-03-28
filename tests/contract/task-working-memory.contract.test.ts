import { describe, expect, it } from "vitest";

import { parseWorkingMemory } from "../../src/domain/runtime/working-memory.js";

describe("task working-memory contract", () => {
  it("parses the compact working-memory shape", () => {
    const memory = parseWorkingMemory({
      taskId: "TASK-001",
      currentObjective: "Add billing retry handling",
      currentPlan: ["Inspect billing service", "Update webhook route"],
      filesInFocus: ["src/billing/service.ts"],
      confirmedFacts: ["Billing service owns webhook retry logic"],
      openQuestions: ["Do route tests already cover retries?"],
      nextStep: "Review the billing route tests",
      lastUpdated: "2026-03-27T09:00:00.000Z"
    });

    expect(memory.taskId).toBe("TASK-001");
    expect(memory.currentPlan.length).toBe(2);
  });

  it.todo("compacts runtime working memory before it grows into a transcript");
});
