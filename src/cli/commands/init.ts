import path from "node:path";
import { Command } from "commander";

import { initializeWorkspace } from "../../application/install/initialize-workspace.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT } from "../../shared/index.js";
import { runInteractiveOnboarding } from "../interactive/onboarding-flow.js";
import { applySetupIntent } from "../interactive/review-plan.js";
import { detectTerminalCapabilities } from "../interactive/terminal-capabilities.js";
import { getSetupProfileDescriptor, normalizeFolderSelection, type OptionalModuleId, type SetupProfileId } from "../interactive/setup-intent.js";

function collect(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

export function registerInitCommands(program: Command): void {
  program
    .command("init")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--agent <target>", "agent target to install", collect, [])
    .option("--setup-profile <profile>", "interactive setup profile (quick, recommended, advanced)", "recommended")
    .option("--module <module>", "optional module", collect, [])
    .option("--dry-run", "preview setup without writing files", false)
    .option("--yes", "apply direct setup without prompting", false)
    .option("--interactive", "force guided interactive setup", false)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const capabilities = detectTerminalCapabilities();
      const setupProfile = options.setupProfile as SetupProfileId;
      const defaultModules = getSetupProfileDescriptor(setupProfile).defaultModules;
      const shouldUseInteractive =
        options.interactive ||
        (!options.json &&
          !options.yes &&
          !options.dryRun &&
          options.agent.length === 0 &&
          capabilities.supportsInteractiveInput);

      if (shouldUseInteractive) {
        const summary = await runInteractiveOnboarding(workspaceRoot);
        if (options.json) {
          console.log(toJson(summary));
        }
        return;
      }

      const folderSelection =
        workspaceRoot === path.resolve(process.cwd())
          ? normalizeFolderSelection(workspaceRoot, "current-directory", ".")
          : normalizeFolderSelection(process.cwd(), "custom-path", workspaceRoot);
      const result =
        options.agent.length > 0 || options.dryRun || options.yes
          ? await applySetupIntent({
              workspaceRoot,
              folderSelection,
              targetIds: options.agent,
              setupProfile,
              enabledModules: (options.module.length > 0 ? options.module : defaultModules) as OptionalModuleId[],
              recommendedTargetIds: options.agent,
              dryRun: options.dryRun || !options.yes,
              applyChanges: options.yes && !options.dryRun,
              source: "direct"
            })
          : await initializeWorkspace(workspaceRoot, PACKAGE_ROOT);

      if ("status" in result) {
        if (options.json) {
          console.log(toJson(result));
          return;
        }

        console.log(result.operatorMessage);
        if (result.nextSuggestedCommands.length > 0) {
          console.log(`Next: ${result.nextSuggestedCommands.join(" | ")}`);
        }
        return;
      }

      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "init-run",
        subjectId: "init",
        result: "success",
        recordedAt: new Date().toISOString(),
        details: {
          runtimeSchemaVersion: result.installState.runtimeSchemaVersion,
          installedTargets: result.installState.installedTargets.length
        }
      });

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Initialized Harness Forge workspace at ${workspaceRoot}`);
      console.log(`Runtime schema version: ${result.installState.runtimeSchemaVersion}`);
      console.log(`Install state: ${result.statePath}`);
      console.log(`Runtime index: ${result.runtimeIndexPath}`);
    });
}
