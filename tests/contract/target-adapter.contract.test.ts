import { describe, expect, it } from "vitest";
import { validateTargetAdapters } from "../../src/application/install/validate-target-adapters.js";

describe("target adapter contract", () => {
  it("validates required adapter fields", () => {
    const result = validateTargetAdapters([
      {
        id: "codex",
        displayName: "Codex",
        supportLevel: "full",
        supportsHooks: false,
        supportsCommands: true,
        supportsAgents: true,
        supportsContexts: true,
        supportsPlugins: false,
        pathMappings: { "targets/codex/runtime/.codex": ".codex" },
        mergeRules: {},
        sharedRuntimeBridge: {
          instructionSurfaces: ["AGENTS.md"],
          supportMode: "native",
          runtimeSurfaces: [".hforge/runtime/index.json"]
        }
      }
    ]);
    expect(result[0].valid).toBe(true);
  });
});
