import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock readline before importing the adapter
vi.mock("node:readline", () => {
  let nextAnswer = "1";
  return {
    createInterface: () => ({
      question: (_prompt: string, cb: (answer: string) => void) => {
        // Use setImmediate to simulate async readline behavior
        setImmediate(() => cb(nextAnswer));
      },
      close: () => {},
    }),
    __setNextAnswer: (answer: string) => {
      nextAnswer = answer;
    },
  };
});

// Get the setter function to control answers
async function setNextAnswer(answer: string) {
  const rl = await import("node:readline");
  (rl as unknown as { __setNextAnswer: (a: string) => void }).__setNextAnswer(answer);
}

describe("CurrentPromptAdapter", () => {
  let logs: string[];
  const origLog = console.log;

  beforeEach(() => {
    logs = [];
    console.log = (...args: unknown[]) => logs.push(args.join(" "));
  });

  afterEach(() => {
    console.log = origLog;
  });

  it("select returns first choice value by default (input '1')", async () => {
    await setNextAnswer("1");
    const { CurrentPromptAdapter } = await import(
      "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js"
    );
    const adapter = new CurrentPromptAdapter();
    const result = await adapter.select({
      message: "Pick one",
      choices: [
        { label: "Option A", value: "a" },
        { label: "Option B", value: "b" },
      ],
    });
    expect(result).toBe("a");
    expect(logs.some((l) => l.includes("Pick one"))).toBe(true);
    expect(logs.some((l) => l.includes("Option A"))).toBe(true);
    expect(logs.some((l) => l.includes("Option B"))).toBe(true);
  });

  it("select returns second choice value for input '2'", async () => {
    await setNextAnswer("2");
    const { CurrentPromptAdapter } = await import(
      "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js"
    );
    const adapter = new CurrentPromptAdapter();
    const result = await adapter.select({
      message: "Pick",
      choices: [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ],
    });
    expect(result).toBe("b");
  });

  it("select defaults to first choice on invalid input", async () => {
    await setNextAnswer("invalid");
    const { CurrentPromptAdapter } = await import(
      "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js"
    );
    const adapter = new CurrentPromptAdapter();
    const result = await adapter.select({
      message: "Pick",
      choices: [
        { label: "A", value: "a" },
        { label: "B", value: "b" },
      ],
    });
    expect(result).toBe("a");
  });

  it("confirm returns true for 'y'", async () => {
    await setNextAnswer("y");
    const { CurrentPromptAdapter } = await import(
      "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js"
    );
    const adapter = new CurrentPromptAdapter();
    const result = await adapter.confirm("Continue?");
    expect(result).toBe(true);
  });

  it("confirm returns true for 'yes'", async () => {
    await setNextAnswer("yes");
    const { CurrentPromptAdapter } = await import(
      "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js"
    );
    const adapter = new CurrentPromptAdapter();
    const result = await adapter.confirm("Continue?");
    expect(result).toBe(true);
  });

  it("confirm returns false for 'n'", async () => {
    await setNextAnswer("n");
    const { CurrentPromptAdapter } = await import(
      "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js"
    );
    const adapter = new CurrentPromptAdapter();
    const result = await adapter.confirm("Continue?");
    expect(result).toBe(false);
  });

  it("textInput returns user input", async () => {
    await setNextAnswer("hello world");
    const { CurrentPromptAdapter } = await import(
      "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js"
    );
    const adapter = new CurrentPromptAdapter();
    const result = await adapter.textInput("Enter text");
    expect(result).toBe("hello world");
  });

  it("multiSelect delegates to select and wraps in array", async () => {
    await setNextAnswer("1");
    const { CurrentPromptAdapter } = await import(
      "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js"
    );
    const adapter = new CurrentPromptAdapter();
    const result = await adapter.multiSelect({
      message: "Select items",
      choices: [
        { label: "Item 1", value: "item1" },
        { label: "Item 2", value: "item2" },
      ],
    });
    expect(result).toEqual(["item1"]);
  });

  it("showProgress renders all step statuses", async () => {
    const { CurrentPromptAdapter } = await import(
      "../../src/infrastructure/presentation/adapters/current-prompt-adapter.js"
    );
    const adapter = new CurrentPromptAdapter();
    adapter.showProgress([
      { label: "Step 1", status: "done" },
      { label: "Step 2", status: "failed" },
      { label: "Step 3", status: "running" },
      { label: "Step 4", status: "pending" },
    ]);
    expect(logs.length).toBe(4);
    expect(logs[0]).toContain("Step 1");
    expect(logs[1]).toContain("Step 2");
    expect(logs[2]).toContain("Step 3");
    expect(logs[3]).toContain("Step 4");
  });
});
