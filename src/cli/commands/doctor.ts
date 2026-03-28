import path from "node:path";
import { Command } from "commander";

import { createDoctorReport } from "../../application/maintenance/doctor-workspace.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerDoctorCommands(program: Command): void {
  program
    .command("doctor")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const result = await createDoctorReport(workspaceRoot, PACKAGE_ROOT);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "doctor-run",
        subjectId: "doctor",
        result: result.status === "clean" ? "success" : result.status === "missing" ? "skipped" : "failed",
        recordedAt: new Date().toISOString(),
        details: { status: result.status }
      });
      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Workspace: ${workspaceRoot}`);
      console.log(`Doctor status: ${result.status}`);
      console.log(`Installed targets: ${result.audit.installedTargets.join(", ") || "none"}`);
      console.log(`Missing managed paths: ${result.audit.missingManagedPaths.length}`);
      console.log(`Missing bundles: ${result.audit.missingBundles.length}`);
      console.log(`Stale task artifacts: ${result.audit.staleTaskArtifacts.length}`);
    });
}
