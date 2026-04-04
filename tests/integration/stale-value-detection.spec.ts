import { describe, expect, it } from "vitest";

import { detectStaleWorkspace } from "../../src/application/runtime/detect-stale-workspace.js";

describe("detectStaleWorkspace", () => {
  const workspaceRoot = "/tmp/test-workspace";

  it("returns a warning when last runtime command was 45 days ago", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
    const warnings = detectStaleWorkspace(workspaceRoot, past.toISOString());

    expect(warnings).toHaveLength(1);
    expect(warnings[0].daysSinceLastUse).toBeGreaterThanOrEqual(45);
    expect(warnings[0].workspaceRoot).toBe(workspaceRoot);
    expect(warnings[0].recommendation).toContain("days");
    expect(warnings[0].warningId).toMatch(/^stale-/);
  });

  it("returns no warning when last runtime command was 10 days ago", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const warnings = detectStaleWorkspace(workspaceRoot, past.toISOString());

    expect(warnings).toHaveLength(0);
  });

  it("returns no warning when lastRuntimeCommandAt is null", () => {
    const warnings = detectStaleWorkspace(workspaceRoot, null);

    expect(warnings).toHaveLength(0);
  });

  it("returns no warning at exactly the threshold boundary", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const warnings = detectStaleWorkspace(workspaceRoot, past.toISOString());

    expect(warnings).toHaveLength(0);
  });

  it("respects a custom threshold", () => {
    const now = new Date();
    const past = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const warnings = detectStaleWorkspace(workspaceRoot, past.toISOString(), 7);

    expect(warnings).toHaveLength(1);
    expect(warnings[0].daysSinceLastUse).toBeGreaterThanOrEqual(10);
  });
});
