import { describe, expect, it } from "vitest";

import { chooseDefaultInteractiveRoute } from "../../src/cli/interactive/entry-router.js";
import type { CliInvocationContext } from "../../src/cli/interactive/invocation-context.js";
import { detectTerminalCapabilities } from "../../src/cli/interactive/terminal-capabilities.js";

function createContext(overrides: Partial<CliInvocationContext>): CliInvocationContext {
  return {
    argv: [],
    cwd: process.cwd(),
    explicitCommand: null,
    providedFlags: [],
    isTty: true,
    isCi: false,
    detectedWorkspaceRoot: process.cwd(),
    detectedRuntimeState: "absent",
    terminalProfile: detectTerminalCapabilities({
      env: { ...process.env, CI: "false", HFORGE_FORCE_TTY: "1" },
      stdinIsTTY: true,
      stdoutIsTTY: true,
      columns: 100
    }),
    ...overrides
  };
}

describe("interactive entry contract", () => {
  it("routes first-run no-argument TTY startup into onboarding", async () => {
    const route = await chooseDefaultInteractiveRoute(createContext({ detectedRuntimeState: "absent" }));
    expect(route).toBe("onboarding");
  });

  it("routes initialized workspaces into the project hub", async () => {
    const route = await chooseDefaultInteractiveRoute(createContext({ detectedRuntimeState: "present" }));
    expect(route).toBe("project-hub");
  });

  it("does not prompt when interactive input is unavailable", async () => {
    const route = await chooseDefaultInteractiveRoute(
      createContext({
        terminalProfile: detectTerminalCapabilities({
          env: { ...process.env, CI: "true", HFORGE_FORCE_TTY: "0" },
          stdinIsTTY: false,
          stdoutIsTTY: false,
          columns: 80
        })
      })
    );
    expect(route).toBe("none");
  });
});
