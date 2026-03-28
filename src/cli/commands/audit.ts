import path from "node:path";
import { Command } from "commander";

import { createAuditReport } from "../../application/maintenance/audit-install.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerAuditCommands(program: Command): void {
  program
    .command("audit")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = await createAuditReport(workspaceRoot, PACKAGE_ROOT);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "audit-run",
        subjectId: "audit",
        result: result.missingManagedPaths.length === 0 ? "success" : "failed",
        recordedAt: new Date().toISOString(),
        details: {
          missingManagedPaths: result.missingManagedPaths.length,
          missingBundles: result.missingBundles.length
        }
      });
      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Workspace: ${workspaceRoot}`);
      console.log(`Package version: ${result.packageVersion}`);
      console.log(`Installed targets: ${result.installedTargets.join(", ") || "none"}`);
      console.log(`Installed bundles: ${result.installedBundles.length}`);
      console.log(`Missing managed paths: ${result.missingManagedPaths.length}`);
      console.log(`Package surface gaps: ${result.packageSurfaceMissingPaths.length}`);
      console.log(`Stale task artifacts: ${result.staleTaskArtifacts.length}`);
    });
}
