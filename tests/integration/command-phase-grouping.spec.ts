import { describe, expect, it } from "vitest";

import { loadAgentCommandCatalog } from "../../src/application/runtime/command-catalog.js";
import { PHASE_ORDER, PHASE_LABELS, type CommandPhaseId } from "../../src/application/runtime/command-phase-mapping.js";

const root = process.cwd();

describe("command phase grouping integration", () => {
  it("every cli command entry has a phase field after catalog build", async () => {
    const catalog = await loadAgentCommandCatalog(root);

    expect(catalog.cliCommands.length).toBeGreaterThan(0);

    for (const entry of catalog.cliCommands) {
      expect(entry.phase).toBeDefined();
      expect(PHASE_ORDER).toContain(entry.phase);
    }
  });

  it("grouping by phase produces non-empty groups for setup, operate, and maintain", async () => {
    const catalog = await loadAgentCommandCatalog(root);

    const grouped: Record<CommandPhaseId, typeof catalog.cliCommands> = {
      setup: [],
      operate: [],
      maintain: [],
      advanced: [],
    };

    for (const entry of catalog.cliCommands) {
      if (entry.phase) {
        grouped[entry.phase].push(entry);
      }
    }

    expect(grouped.setup.length).toBeGreaterThan(0);
    expect(grouped.operate.length).toBeGreaterThan(0);
    expect(grouped.maintain.length).toBeGreaterThan(0);
  });

  it("at most one command per phase is marked primaryInPhase", async () => {
    const catalog = await loadAgentCommandCatalog(root);

    for (const phase of PHASE_ORDER) {
      const primaries = catalog.cliCommands.filter(
        (entry) => entry.phase === phase && entry.primaryInPhase === true
      );
      expect(primaries.length).toBeLessThanOrEqual(1);
    }
  });

  it("PHASE_LABELS covers all phases", () => {
    for (const phase of PHASE_ORDER) {
      expect(PHASE_LABELS[phase]).toBeTruthy();
    }
  });
});
