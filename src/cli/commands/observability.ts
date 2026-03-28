import path from "node:path";
import { Command } from "commander";

import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { runNodeScript } from "./script-runner.js";

export function registerObservabilityCommands(program: Command): void {
  const observability = program
    .command("observability")
    .description("Local observability reporting and summary commands.");

  observability
    .command("summarize")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((options) => {
      const workspaceRoot = path.resolve(options.root);
      const args: string[] = [];
      if (options.json) {
        args.push("--json");
      }
      runNodeScript("scripts/runtime/summarize-observability.mjs", workspaceRoot, args);
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
