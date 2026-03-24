import { Command } from "commander";
import path from "node:path";
import fs from "node:fs/promises";

import { scanReferenceInstall } from "../../application/migration/scan-reference-install.js";
import { reconcileState } from "../../application/install/reconcile-state.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import { INSTALL_STATE_FILE, REPO_ROOT, STATE_DIR, ValidationError } from "../../shared/index.js";

export function registerMaintenanceCommands(program: Command): void {
  program
    .command("repair")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .option("--dry-run", "preview only", false)
    .action(async (options) => {
      console.log(JSON.stringify(await reconcileState(options.root), null, 2));
    });

  program
    .command("backup")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .action(async (options) => {
      const state = await loadInstallState(options.root);
      const destination = path.join(options.root, STATE_DIR, "backup-snapshot.json");
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, JSON.stringify(state, null, 2), "utf8");
      console.log(destination);
    });

  program
    .command("restore")
    .option("--from-state <file>", "backup state file")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .action(async (options) => {
      const snapshotPath = options.fromState ?? path.join(options.root, STATE_DIR, "backup-snapshot.json");
      const snapshot = JSON.parse(await fs.readFile(snapshotPath, "utf8"));
      await saveInstallState(options.root, snapshot);
      console.log(JSON.stringify({ restored: snapshotPath, installState: path.join(options.root, STATE_DIR, INSTALL_STATE_FILE) }, null, 2));
    });

  program
    .command("uninstall")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .option("--dry-run", "preview only", false)
    .option("--yes", "apply uninstall", false)
    .action(async (options) => {
      const state = await loadInstallState(options.root);
      const files = state?.fileWrites ?? [];
      if (!options.dryRun && !options.yes) {
        throw new ValidationError('Uninstall is destructive. Re-run with "--dry-run" to preview or "--yes" to apply.');
      }

      if (!options.dryRun) {
        await Promise.all(
          files.map(async (file) => {
            await fs.rm(file, { force: true, recursive: true });
          })
        );
        await fs.rm(path.join(options.root, STATE_DIR), { force: true, recursive: true });
      }

      console.log(JSON.stringify({ dryRun: options.dryRun, files }, null, 2));
    });

  program
    .command("upgrade")
    .option("--dry-run", "preview only", false)
    .option("--root <root>", "workspace root", REPO_ROOT)
    .action(async (options) => {
      const state = await loadInstallState(options.root);
      const result = {
        dryRun: options.dryRun,
        target: state?.installedTargets[0] ?? null,
        bundles: state?.installedBundles ?? [],
        recommendation: state ? "Run install again with the current target and bundle set to refresh shipped assets." : "No existing install state found."
      };
      console.log(JSON.stringify(result, null, 2));
    });

  program
    .command("migrate")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .action(async (options) => {
      console.log(JSON.stringify(await scanReferenceInstall(options.root), null, 2));
    });
}
