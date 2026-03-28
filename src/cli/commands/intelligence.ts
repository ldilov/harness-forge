import path from "node:path";
import { Command } from "commander";

import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { runNodeScript } from "./script-runner.js";

export function registerIntelligenceCommands(program: Command): void {
  program
    .command("scan")
    .argument("[root]", "repository root to inspect", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((rootArgument: string, options) => {
      const workspaceRoot = path.resolve(rootArgument);
      const args = [workspaceRoot];
      if (options.json) {
        args.push("--json");
      }
      runNodeScript("scripts/intelligence/scan-repo.mjs", workspaceRoot, args);
    });

  program
    .command("cartograph")
    .argument("[root]", "repository root to inspect", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((rootArgument: string, options) => {
      const workspaceRoot = path.resolve(rootArgument);
      const args = [workspaceRoot];
      if (options.json) {
        args.push("--json");
      }
      runNodeScript("scripts/intelligence/cartograph-repo.mjs", workspaceRoot, args);
    });

  program
    .command("classify-boundaries")
    .argument("[root]", "repository root to inspect", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action((rootArgument: string, options) => {
      const workspaceRoot = path.resolve(rootArgument);
      const args = [workspaceRoot];
      if (options.json) {
        args.push("--json");
      }
      runNodeScript("scripts/intelligence/classify-boundaries.mjs", workspaceRoot, args);
    });

  program
    .command("synthesize-instructions")
    .argument("[root]", "repository root to inspect", DEFAULT_WORKSPACE_ROOT)
    .option("--target <target>", "target runtime to synthesize for", "codex")
    .option("--write", "write the generated instruction plan to the repo", false)
    .option("--diff", "show a diff-style recommendation summary", false)
    .option("--json", "json output", false)
    .action((rootArgument: string, options) => {
      const workspaceRoot = path.resolve(rootArgument);
      const args = [workspaceRoot, "--target", options.target];
      if (options.write) {
        args.push("--write");
      }
      if (options.diff) {
        args.push("--diff");
      }
      if (options.json) {
        args.push("--json");
      }
      runNodeScript("scripts/intelligence/synthesize-instructions.mjs", workspaceRoot, args);
    });
}
