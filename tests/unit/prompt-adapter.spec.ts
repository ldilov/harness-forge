import { describe, it, expect } from "vitest";
import { CurrentPromptAdapter } from "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js";

describe("CurrentPromptAdapter", () => {
  it("implements PromptAdapter interface", () => {
    const adapter = new CurrentPromptAdapter();
    expect(typeof adapter.select).toBe("function");
    expect(typeof adapter.confirm).toBe("function");
    expect(typeof adapter.textInput).toBe("function");
    expect(typeof adapter.multiSelect).toBe("function");
    expect(typeof adapter.showProgress).toBe("function");
  });

  it("showProgress renders all step statuses", () => {
    const adapter = new CurrentPromptAdapter();
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(" "));

    adapter.showProgress([
      { label: "Step 1", status: "done" },
      { label: "Step 2", status: "failed" },
      { label: "Step 3", status: "running" },
      { label: "Step 4", status: "pending" },
    ]);

    console.log = originalLog;

    expect(logs.length).toBe(4);
    expect(logs[0]).toContain("\u2714");
    expect(logs[0]).toContain("Step 1");
    expect(logs[1]).toContain("\u2717");
    expect(logs[1]).toContain("Step 2");
    expect(logs[2]).toContain("\u2026");
    expect(logs[2]).toContain("Step 3");
    expect(logs[3]).toContain("Step 4");
  });
});
