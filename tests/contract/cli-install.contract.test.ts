import { describe, expect, it } from "vitest";

import { registerInstallCommands } from "../../src/cli/commands/install.js";

describe("install command contract", () => {
  it("registers install handlers", () => {
    expect(typeof registerInstallCommands).toBe("function");
  });
});
