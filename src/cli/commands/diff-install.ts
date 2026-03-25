import path from "node:path";
import { Command } from "commander";

import { createDiffInstallReport } from "../../application/maintenance/diff-install.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerDiffInstallCommands(program: Command): void {
  program
    .command("diff-install")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = await createDiffInstallReport(workspaceRoot);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "diff-install-run",
        subjectId: "diff-install",
        result: result.missing.length === 0 ? "success" : "failed",
        recordedAt: new Date().toISOString(),
        details: { missing: result.missing.length }
      });
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
