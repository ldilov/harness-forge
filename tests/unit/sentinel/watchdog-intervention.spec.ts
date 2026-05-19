import { describe, expect, it } from "vitest";

import {
  interventionRank,
  nextInterventionStep,
  type InterventionStep,
} from "../../../src/domain/sentinel/watchdog/intervention.js";

describe("interventionRank", () => {
  it("ranks the steps in escalation order", () => {
    const order: InterventionStep[] = [
      "observe",
      "warn",
      "constrain",
      "pause",
      "require_approval",
      "terminate",
      "rollback",
    ];
    for (let i = 0; i < order.length - 1; i += 1) {
      expect(interventionRank(order[i]!)).toBeLessThan(interventionRank(order[i + 1]!));
    }
  });
});

describe("nextInterventionStep", () => {
  it("escalates one step at a time", () => {
    expect(nextInterventionStep("observe")).toBe("warn");
    expect(nextInterventionStep("warn")).toBe("constrain");
    expect(nextInterventionStep("constrain")).toBe("pause");
    expect(nextInterventionStep("pause")).toBe("require_approval");
    expect(nextInterventionStep("require_approval")).toBe("terminate");
    expect(nextInterventionStep("terminate")).toBe("rollback");
  });

  it("returns null at the top of the ladder", () => {
    expect(nextInterventionStep("rollback")).toBeNull();
  });
});
