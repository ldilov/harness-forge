import { describe, expect, it } from "vitest";

import { COMMAND_PHASE_MAP, PHASE_ORDER, resolveCommandPhase } from "../../src/application/runtime/command-phase-mapping.js";
import { loadAgentCommandCatalog } from "../../src/application/runtime/command-catalog.js";

const root = process.cwd();

describe("command phase catalog contract", () => {
  it("COMMAND_PHASE_MAP covers every mapped key with a valid phase", () => {
    for (const [key, mapping] of Object.entries(COMMAND_PHASE_MAP)) {
      expect(key).toBeTruthy();
      expect(PHASE_ORDER).toContain(mapping.phase);
      expect(typeof mapping.primaryInPhase).toBe("boolean");
    }
  });

  it("no phase mapping returns a null phase", () => {
    for (const mapping of Object.values(COMMAND_PHASE_MAP)) {
      expect(mapping.phase).not.toBeNull();
      expect(mapping.phase).not.toBeUndefined();
    }
  });

  it("every phase has at least one command mapped", () => {
    for (const phase of PHASE_ORDER) {
      const commands = Object.values(COMMAND_PHASE_MAP).filter(
        (mapping) => mapping.phase === phase
      );
      expect(commands.length).toBeGreaterThan(0);
    }
  });

  it("resolveCommandPhase returns a fallback for unknown ids", () => {
    const mapping = resolveCommandPhase("completely-unknown-command");
    expect(mapping.phase).toBe("advanced");
    expect(mapping.primaryInPhase).toBe(false);
  });

  it("resolveCommandPhase matches compound command ids by prefix", () => {
    const initBasic = resolveCommandPhase("init-basic");
    expect(initBasic.phase).toBe("setup");

    const taskList = resolveCommandPhase("task-list");
    expect(taskList.phase).toBe("operate");

    const recursivePlan = resolveCommandPhase("recursive-plan");
    expect(recursivePlan.phase).toBe("operate");
  });

  it("catalog cliCommands all have phase metadata after loading", async () => {
    const catalog = await loadAgentCommandCatalog(root);
    for (const entry of catalog.cliCommands) {
      expect(entry.phase).toBeDefined();
      expect(PHASE_ORDER).toContain(entry.phase);
      expect(typeof entry.primaryInPhase).toBe("boolean");
    }
  });
});
