import { describe, it, expect } from "vitest";
import { compareTargets } from "../../src/application/targets/compare-targets.js";

describe("target comparison", () => {
  const workspaceRoot = process.cwd();

  it("compares codex vs claude-code successfully", async () => {
    const report = await compareTargets({
      leftTargetId: "codex",
      rightTargetId: "claude-code",
      workspaceRoot,
    });
    expect(report.leftTargetId).toBe("codex");
    expect(report.rightTargetId).toBe("claude-code");
    expect(report.headlineVerdict.length).toBeGreaterThan(0);
    expect(report.capabilityComparisons.length).toBeGreaterThan(0);
    expect(report.sharedStrengths.length).toBeGreaterThan(0);
  });

  it("rejects same-target comparison", async () => {
    await expect(
      compareTargets({ leftTargetId: "codex", rightTargetId: "codex", workspaceRoot })
    ).rejects.toThrow("Cannot compare target");
  });

  it("rejects unknown target", async () => {
    await expect(
      compareTargets({ leftTargetId: "codex", rightTargetId: "nonexistent-target", workspaceRoot })
    ).rejects.toThrow("Unknown target");
  });

  it("comparison capabilities are sourced from matrix", async () => {
    const report = await compareTargets({
      leftTargetId: "codex",
      rightTargetId: "claude-code",
      workspaceRoot,
    });
    for (const comp of report.capabilityComparisons) {
      expect(comp.capabilityId.length).toBeGreaterThan(0);
      expect(comp.operatorImpact.length).toBeGreaterThan(0);
      expect(["left", "right", "tie", "depends"]).toContain(comp.winner);
    }
  });
});
