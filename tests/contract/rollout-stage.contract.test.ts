import { describe, expect, it } from "vitest";
import { parseRolloutStageRecord } from "../../src/domain/runtime/governance-gates.js";

describe("rollout stage contract", () => {
  it("parses stage records", () => {
    const stage = parseRolloutStageRecord({
      stageId: "S1",
      stageName: "Observe",
      entryCriteria: [],
      exitCriteria: ["baseline-complete"],
      status: "active"
    });
    expect(stage.stageId).toBe("S1");
  });
});
