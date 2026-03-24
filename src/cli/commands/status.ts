import { Command } from "commander";

import { loadInstallState } from "../../domain/state/install-state.js";
import { reconcileState } from "../../application/install/reconcile-state.js";
import { REPO_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerStatusCommands(program: Command): void {
  program
    .command("status")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const state = await loadInstallState(options.root);
      if (options.json) {
        console.log(toJson(state));
        return;
      }
      console.log(state ? JSON.stringify(state, null, 2) : "No install state found.");
    });

  program
    .command("doctor")
    .option("--root <root>", "workspace root", REPO_ROOT)
    .action(async (options) => {
      const result = await reconcileState(options.root);
      console.log(JSON.stringify(result, null, 2));
    });
}
