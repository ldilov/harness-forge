import path from "node:path";
import { Command } from "commander";

import { importBundle, previewImport } from "../../application/loop/bundle-importer.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerImportCommands(program: Command): void {
  program
    .command("import <file>")
    .description("Import a .hfb bundle into the current workspace")
    .option("--dry-run", "Preview what would change without applying", false)
    .option("--insights-only", "Import only patterns, skip policies", false)
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "Output as JSON", false)
    .action(async (file: string, options: { dryRun: boolean; insightsOnly: boolean; root: string; json: boolean }) => {
      const workspaceRoot = path.resolve(options.root);
      const bundlePath = path.resolve(file);

      const result = options.dryRun
        ? await previewImport(workspaceRoot, bundlePath)
        : await importBundle(workspaceRoot, bundlePath, {
            insightsOnly: options.insightsOnly,
          });

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      const verb = options.dryRun ? "Would import" : "Imported";
      console.log(`${verb}: ${result.added} patterns added, ${result.updated} updated, ${result.conflicts.length} conflicts`);

      if (result.conflicts.length > 0) {
        for (const c of result.conflicts) {
          console.log(`  ${c.patternId}: ${c.resolution} (local=${c.localConfidence}, imported=${c.importedConfidence})`);
        }
      }

      if (options.dryRun) {
        console.log('Preview only. Re-run without "--dry-run" to apply.');
      }
    });
}
