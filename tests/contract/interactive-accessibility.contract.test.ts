import { describe, expect, it } from "vitest";

import { detectTerminalCapabilities } from "../../src/cli/interactive/terminal-capabilities.js";
import { renderWelcomeScreen } from "../../src/cli/interactive/renderers/welcome-screen.js";

describe("interactive accessibility contract", () => {
  it("degrades cleanly in no-color narrow terminal mode", () => {
    const capabilities = detectTerminalCapabilities({
      env: { ...process.env, NO_COLOR: "1", HFORGE_FORCE_TTY: "1", HFORGE_TERM_WIDTH: "40" },
      stdinIsTTY: true,
      stdoutIsTTY: true,
      columns: 40
    });

    const welcome = renderWelcomeScreen(capabilities);
    expect(capabilities.colorLevel).toBe("none");
    expect(capabilities.presentationTier).toBe("minimal");
    expect(welcome).not.toContain("\u001b[");
    expect(welcome).toContain("Harness Forge Setup");
  });
});
