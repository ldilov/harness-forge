import { Command } from "commander";
import path from "node:path";

import { loadInstallState } from "../../domain/state/install-state.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerStatusCommands(program: Command): void {
  program
    .command("status")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const state = await loadInstallState(workspaceRoot);
      if (options.json) {
        console.log(toJson(state));
        return;
      }
      console.log(state ? JSON.stringify(state, null, 2) : `No install state found at ${workspaceRoot}.`);
    });
}
