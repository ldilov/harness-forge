import { describe, expect, it } from "vitest";

import { registerLearnCommands } from "../../src/cli/commands/learn.js";

describe("learn commands contract", () => {
  it("registerLearnCommands is a function", () => {
    expect(typeof registerLearnCommands).toBe("function");
  });
});
