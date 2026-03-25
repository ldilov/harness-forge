import path from "node:path";
import { Command } from "commander";

import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { recommendFromIntelligence } from "../../application/recommendations/recommend-from-intelligence.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { formatRecommendationReport } from "../../infrastructure/diagnostics/recommendation-reporter.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";

export function registerRecommendCommands(program: Command): void {
  program
    .command("recommend")
    .argument("[root]", "repository root to inspect", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (rootArgument: string, options) => {
      const workspaceRoot = path.resolve(rootArgument);
      const result = await recommendFromIntelligence(workspaceRoot);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "recommendation-run",
        subjectId: result.repoType,
        result: "accepted",
        recordedAt: new Date().toISOString(),
        details: { bundles: result.recommendations.bundles.length }
      });

      console.log(options.json ? toJson(result) : formatRecommendationReport(result));
    });
}
