import { Command } from "commander";
import { recommendNextAction } from "../../application/next/recommend-next-action.js";
import { presentNextAction } from "../../infrastructure/presentation/presenters/next-action-presenter.js";
import { serializeNextAction } from "../../infrastructure/presentation/serializers/next-action-json.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/constants.js";

export function registerNextCommands(program: Command): void {
  program
    .command("next")
    .description("Recommend the single most useful next action for this workspace")
    .option("--root <root>", "Workspace root path", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "Output as JSON", false)
    .option("--verbose", "Show full reasoning including alternatives and scores", false)
    .option("--include-alternatives", "Include alternative actions in output", false)
    .option("--apply-safe-fixes", "Auto-run the recommended action if it is classified as safe-auto", false)
    .action(async (options: {
      root: string;
      json: boolean;
      verbose: boolean;
      includeAlternatives: boolean;
      applySafeFixes: boolean;
    }) => {
      const plan = await recommendNextAction({ workspaceRoot: options.root });

      if (options.json) {
        console.log(serializeNextAction(plan));
        return;
      }

      const showAlternatives = options.verbose || options.includeAlternatives;
      console.log(presentNextAction(plan, showAlternatives));

      if (options.applySafeFixes) {
        if (plan.safeToAutoApply) {
          console.log(`\nRunning safe action: ${plan.command}`);
          const { execSync } = await import("node:child_process");
          try {
            execSync(plan.command, { stdio: "inherit", cwd: options.root });
            console.log("\nAction completed successfully.");
            if (plan.followUps.length > 0) {
              console.log(`Next recommended follow-up: ${plan.followUps[0]!.command}`);
            }
          } catch {
            console.error("\nAction failed. Please run manually.");
          }
        } else {
          console.log(`\nAction "${plan.title}" is classified as ${plan.classification} and cannot be auto-applied.`);
          console.log("Please review and run manually.");
        }
      }
    });
}
