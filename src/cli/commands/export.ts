import path from "node:path";
import { Command } from "commander";

import { createAuditReport } from "../../application/maintenance/audit-install.js";
import { createDoctorReport } from "../../application/maintenance/doctor-workspace.js";
import { loadInstallState } from "../../domain/state/install-state.js";
import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT, RUNTIME_DIR, RUNTIME_INDEX_FILE, exists, readJsonFile, writeJsonFile } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerExportCommands(program: Command): void {
  program
    .command("export")
    .description("Export a workspace runtime summary for review or handoff.")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--output <file>", "write the export to a JSON file")
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const runtimeIndexPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INDEX_FILE);
      const [installState, doctor, audit, runtimeIndex] = await Promise.all([
        loadInstallState(workspaceRoot),
        createDoctorReport(workspaceRoot, PACKAGE_ROOT),
        createAuditReport(workspaceRoot, PACKAGE_ROOT),
        (async () => ((await exists(runtimeIndexPath)) ? readJsonFile(runtimeIndexPath) : null))()
      ]);

      const result = {
        exportedAt: new Date().toISOString(),
        workspaceRoot,
        installState,
        runtimeIndex,
        doctor,
        audit
      };

      if (options.output) {
        await writeJsonFile(path.resolve(options.output), result);
      }

      console.log(options.json || !options.output ? toJson(result) : `Export written to ${path.resolve(options.output)}`);
    });
}
