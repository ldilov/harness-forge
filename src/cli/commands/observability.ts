import path from "node:path";
import { Command } from "commander";

import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { runNodeScript } from "./script-runner.js";
import {
  readEffectivenessSignals,
  summarizeEffectivenessSignalsV2
} from "../../infrastructure/observability/local-metrics-store.js";
import { computeEffectivenessComparison } from "../../application/runtime/compute-effectiveness-comparison.js";

export function registerObservabilityCommands(program: Command): void {
  const observability = program
    .command("observability")
    .description("Local observability reporting and summary commands.");

  observability
    .command("summarize")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .option("--compare-since <timestamp>", "ISO timestamp to compare from")
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const summary = await summarizeEffectivenessSignalsV2(workspaceRoot);

      let comparisonDeltas: Record<string, number> | undefined;
      if (options.compareSince) {
        const signals = await readEffectivenessSignals(workspaceRoot);
        const comparison = computeEffectivenessComparison(
          signals,
          options.compareSince,
          new Date().toISOString()
        );
        comparisonDeltas = { ...comparison.deltas };
      }

      if (options.json) {
        const output = {
          ...summary,
          ...(comparisonDeltas ? { comparisonDeltas } : {})
        };
        process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
      } else {
        process.stdout.write(`Effectiveness signals: ${summary.total}\n`);
        for (const [type, count] of Object.entries(summary.bySignalType)) {
          process.stdout.write(`  ${type}: ${count}\n`);
        }
        for (const [result, count] of Object.entries(summary.byResult)) {
          process.stdout.write(`  result=${result}: ${count}\n`);
        }
        if (summary.dimensions.length > 0) {
          process.stdout.write(`\nDimension scores:\n`);
          for (const dim of summary.dimensions) {
            process.stdout.write(`  ${dim.dimensionId}: ${dim.score}/100 (${dim.confidenceLevel}, ${dim.signalCount} signals)\n`);
          }
        }
        if (summary.suggestedNextActions.length > 0) {
          process.stdout.write(`\nSuggested next actions:\n`);
          for (const action of summary.suggestedNextActions) {
            process.stdout.write(`  - ${action}\n`);
          }
        }
        if (summary.staleWarnings.length > 0) {
          process.stdout.write(`\nStale workspace warnings:\n`);
          for (const warning of summary.staleWarnings) {
            process.stdout.write(`  [${warning.warningId}] ${warning.recommendation}\n`);
          }
        }
        if (comparisonDeltas) {
          process.stdout.write(`\nComparison deltas:\n`);
          for (const [dimension, delta] of Object.entries(comparisonDeltas)) {
            const sign = delta >= 0 ? "+" : "";
            process.stdout.write(`  ${dimension}: ${sign}${delta}\n`);
          }
        }
      }
    });

  observability
    .command("report")
    .argument("[root]", "workspace root to inspect", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((rootArgument: string, options) => {
      const workspaceRoot = path.resolve(rootArgument);
      const args = [workspaceRoot];
      if (options.json) {
        args.push("--json");
      }
      runNodeScript("scripts/runtime/report-effectiveness.mjs", workspaceRoot, args);
    });
}
