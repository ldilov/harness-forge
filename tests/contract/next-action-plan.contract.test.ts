import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { parseNextActionPlan } from "../../src/domain/next/next-action-plan.js";

describe("next action plan contract", () => {
  it("parses example fixture", () => {
    const fixturePath = path.join(
      process.cwd(),
      "tests/fixtures/contracts/next-action.example.json"
    );
    const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf-8"));
    const result = parseNextActionPlan(fixture);
    expect(result.phase).toBe("maintain");
    expect(result.safeToAutoApply).toBe(true);
    expect(result.classification).toBe("safe-auto");
  });

  it("rejects safeToAutoApply mismatch", () => {
    const invalid = {
      generatedAt: "2026-04-04T10:00:00.000Z",
      root: "/workspace",
      phase: "maintain",
      actionId: "test",
      title: "Test",
      command: "hforge test",
      summary: "Test action",
      confidence: 0.8,
      safeToAutoApply: true,
      classification: "safe-manual",
      evidence: [],
      blockingConditions: [],
      followUps: [],
      alternatives: [],
    };
    expect(() => parseNextActionPlan(invalid)).toThrow();
  });
});
