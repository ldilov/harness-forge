import path from "node:path";
import { Command } from "commander";

import { buildOrientationPack } from "../../application/runtime/build-orientation-pack.js";
import { buildSurfaceTierIndex } from "../../application/runtime/build-surface-tiers.js";
import { DEFAULT_WORKSPACE_ROOT, exists, readJsonFile } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerRuntimeCommands(program: Command): void {
  const runtime = program.command("runtime").description("Inspect runtime-native orientation and tier metadata.");

  runtime
    .command("orientation")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--profile <profile>", "runtime profile", "runtime-standard")
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const orientation = buildOrientationPack(options.profile);
      const contextBudgetPath = path.join(workspaceRoot, ".hforge", "runtime", "context-budget.json");
      const contextBudget = (await exists(contextBudgetPath)) ? await readJsonFile(contextBudgetPath) : null;

      const result = {
        workspaceRoot,
        profile: options.profile,
        orientation,
        contextBudget
      };

      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  runtime
    .command("tiers")
    .option("--json", "json output", false)
    .action((options) => {
      const result = buildSurfaceTierIndex([
        { surfacePath: "AGENTS.md", tier: "hot", defaultInclusion: true, dropOrderRank: 0 },
        { surfacePath: ".hforge/agent-manifest.json", tier: "hot", defaultInclusion: true, dropOrderRank: 1 },
        { surfacePath: ".hforge/runtime/index.json", tier: "hot", defaultInclusion: true, dropOrderRank: 2 },
        { surfacePath: ".hforge/library/skills", tier: "warm", defaultInclusion: false, dropOrderRank: 3 },
        { surfacePath: "coverage", tier: "cold", defaultInclusion: false, dropOrderRank: 10 }
      ]);

      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
