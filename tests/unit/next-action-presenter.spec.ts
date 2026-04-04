import { describe, it, expect } from "vitest";
import { presentNextAction } from "../../src/infrastructure/presentation/presenters/next-action-presenter.js";
import type { NextActionPlan } from "../../src/domain/next/next-action-plan.js";

function makePlan(overrides: Partial<NextActionPlan> = {}): NextActionPlan {
  return {
    generatedAt: "2026-04-04T10:00:00.000Z",
    root: "/workspace",
    phase: "maintain",
    actionId: "maintain.refresh-runtime",
    title: "Refresh shared runtime",
    command: "hforge refresh --root .",
    summary: "Runtime index is stale.",
    confidence: 0.91,
    safeToAutoApply: true,
    classification: "safe-auto",
    evidence: [
      { id: "ev1", label: "stale index", path: ".hforge/runtime/index.json", signalType: "runtime-signal", summary: "Runtime index is stale" },
    ],
    blockingConditions: [],
    followUps: [
      { actionId: "review", title: "Review health", command: "hforge review --root .", reason: "Follow-up" },
    ],
    alternatives: [
      { actionId: "export", title: "Export summary", command: "hforge export --root . --json", reason: "Alternative" },
    ],
    ...overrides,
  } as NextActionPlan;
}

describe("presentNextAction", () => {
  it("shows title and command", () => {
    const output = presentNextAction(makePlan());
    expect(output).toContain("Best next action");
    expect(output).toContain("Refresh shared runtime");
    expect(output).toContain("hforge refresh --root .");
  });

  it("shows high confidence for >= 0.8", () => {
    const output = presentNextAction(makePlan({ confidence: 0.91 }));
    expect(output).toContain("Confidence: High");
  });

  it("shows medium confidence for >= 0.5 and < 0.8", () => {
    const output = presentNextAction(makePlan({ confidence: 0.65 }));
    expect(output).toContain("Confidence: Medium");
  });

  it("shows low confidence for < 0.5", () => {
    const output = presentNextAction(makePlan({ confidence: 0.3 }));
    expect(output).toContain("Confidence: Low");
  });

  it("shows safe-to-run for safeToAutoApply true", () => {
    const output = presentNextAction(makePlan({ safeToAutoApply: true, classification: "safe-auto" }));
    expect(output).toContain("Safe to run now");
  });

  it("shows review-before-applying for safeToAutoApply false", () => {
    const output = presentNextAction(makePlan({ safeToAutoApply: false, classification: "safe-manual" }));
    expect(output).toContain("Review before applying");
  });

  it("shows evidence with path suffix", () => {
    const output = presentNextAction(makePlan());
    expect(output).toContain("Runtime index is stale (.hforge/runtime/index.json)");
  });

  it("shows evidence without path suffix when path absent", () => {
    const output = presentNextAction(makePlan({
      evidence: [{ id: "ev1", label: "test", signalType: "runtime-signal", summary: "No path evidence" }],
    }));
    expect(output).toContain("No path evidence");
    expect(output).not.toContain("(undefined)");
  });

  it("hides evidence section when empty", () => {
    const output = presentNextAction(makePlan({ evidence: [] }));
    expect(output).not.toContain("Evidence");
  });

  it("shows follow-ups when present", () => {
    const output = presentNextAction(makePlan());
    expect(output).toContain("Follow-ups");
    expect(output).toContain("hforge review --root .");
  });

  it("hides follow-ups when empty", () => {
    const output = presentNextAction(makePlan({ followUps: [] }));
    expect(output).not.toContain("Follow-ups");
  });

  it("shows alternatives only in verbose mode", () => {
    const nonVerbose = presentNextAction(makePlan(), false);
    expect(nonVerbose).not.toContain("Alternatives");

    const verbose = presentNextAction(makePlan(), true);
    expect(verbose).toContain("Alternatives");
    expect(verbose).toContain("Export summary: hforge export --root . --json");
  });

  it("hides alternatives in verbose mode when empty", () => {
    const output = presentNextAction(makePlan({ alternatives: [] }), true);
    expect(output).not.toContain("Alternatives");
  });
});
