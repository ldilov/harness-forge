import { describe, it, expect } from "vitest";
import { renderProgress, createProgressTracker } from "../../src/infrastructure/presentation/renderers/structured-progress.js";

describe("renderProgress", () => {
  it("renders pending steps with space icon", () => {
    const output = renderProgress([{ label: "Step 1", status: "pending" }]);
    expect(output).toBe("  Step 1");
  });

  it("renders running steps with ellipsis icon", () => {
    const output = renderProgress([{ label: "Step 1", status: "running" }]);
    expect(output).toContain("\u2026");
    expect(output).toContain("Step 1");
  });

  it("renders done steps with check icon", () => {
    const output = renderProgress([{ label: "Step 1", status: "done" }]);
    expect(output).toContain("\u2714");
    expect(output).toContain("Step 1");
  });

  it("renders failed steps with cross icon", () => {
    const output = renderProgress([{ label: "Step 1", status: "failed" }]);
    expect(output).toContain("\u2717");
    expect(output).toContain("Step 1");
  });

  it("renders multiple steps on separate lines", () => {
    const output = renderProgress([
      { label: "First", status: "done" },
      { label: "Second", status: "running" },
      { label: "Third", status: "pending" },
    ]);
    const lines = output.split("\n");
    expect(lines.length).toBe(3);
    expect(lines[0]).toContain("First");
    expect(lines[1]).toContain("Second");
    expect(lines[2]).toContain("Third");
  });

  it("handles empty steps array", () => {
    const output = renderProgress([]);
    expect(output).toBe("");
  });
});

describe("createProgressTracker", () => {
  it("creates tracker with all steps pending", () => {
    const tracker = createProgressTracker(["Step A", "Step B", "Step C"]);
    expect(tracker.steps.length).toBe(3);
    for (const step of tracker.steps) {
      expect(step.status).toBe("pending");
    }
  });

  it("start() sets step to running", () => {
    const tracker = createProgressTracker(["Step A", "Step B"]);
    tracker.start(0);
    expect(tracker.steps[0]!.status).toBe("running");
    expect(tracker.steps[1]!.status).toBe("pending");
  });

  it("complete() sets step to done", () => {
    const tracker = createProgressTracker(["Step A"]);
    tracker.start(0);
    tracker.complete(0);
    expect(tracker.steps[0]!.status).toBe("done");
  });

  it("fail() sets step to failed", () => {
    const tracker = createProgressTracker(["Step A"]);
    tracker.start(0);
    tracker.fail(0);
    expect(tracker.steps[0]!.status).toBe("failed");
  });

  it("render() produces text output", () => {
    const tracker = createProgressTracker(["Step A", "Step B"]);
    tracker.complete(0);
    tracker.start(1);
    const output = tracker.render();
    expect(output).toContain("Step A");
    expect(output).toContain("Step B");
    expect(output).toContain("\u2714");
    expect(output).toContain("\u2026");
  });

  it("ignores out-of-bounds index for start", () => {
    const tracker = createProgressTracker(["Step A"]);
    tracker.start(-1);
    tracker.start(5);
    expect(tracker.steps[0]!.status).toBe("pending");
  });

  it("ignores out-of-bounds index for complete", () => {
    const tracker = createProgressTracker(["Step A"]);
    tracker.complete(-1);
    tracker.complete(5);
    expect(tracker.steps[0]!.status).toBe("pending");
  });

  it("ignores out-of-bounds index for fail", () => {
    const tracker = createProgressTracker(["Step A"]);
    tracker.fail(-1);
    tracker.fail(5);
    expect(tracker.steps[0]!.status).toBe("pending");
  });
});
