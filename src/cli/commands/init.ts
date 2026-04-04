import path from "node:path";
import { Command } from "commander";

import { initializeWorkspace } from "../../application/install/initialize-workspace.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { DEFAULT_WORKSPACE_ROOT, PACKAGE_ROOT, RUNTIME_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE, readJsonFile, exists } from "../../shared/index.js";
import { formatPostInstallSummary } from "../../application/runtime/format-post-install-summary.js";
import { generateOnboardingBrief } from "../../application/runtime/generate-onboarding-brief.js";
import type { OnboardingBrief } from "../../domain/runtime/onboarding-brief.js";
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
    .option("--show-evidence", "Show full evidence list during onboarding", false)
    .option("--show-target-compare", "Show target comparison even for single-target recommendation", false)
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

        if (options.dryRun && result.status === "preview") {
          const previewBriefData = {
            headline: `Preview: ${options.agent[0] ?? "unknown"} target setup`,
            repoType: options.agent[0] ?? "unknown",
            selectedTargets: options.agent.length > 0 ? options.agent : ["unknown"],
            selectedProfile: setupProfile,
            nextBestCommand: "hforge recommend --root . --json"
          };
          console.log(result.operatorMessage);
          console.log(formatPostInstallSummary(previewBriefData, "(dry-run, not written)"));
          return;
        }

        console.log(result.operatorMessage);
        if (result.nextSuggestedCommands.length > 0) {
          console.log(`Next: ${result.nextSuggestedCommands.join(" | ")}`);
        }

        const briefPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE);
        if (await exists(briefPath)) {
          const brief = await readJsonFile<OnboardingBrief>(briefPath);
          console.log(formatPostInstallSummary(brief, briefPath));
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
        },
        category: "firstRun",
        confidenceLevel: "direct"
      });

      if (options.json) {
        console.log(toJson(result));
        return;
      }

      console.log(`Initialized Harness Forge workspace at ${workspaceRoot}`);
      console.log(`Runtime schema version: ${result.installState.runtimeSchemaVersion}`);
      console.log(`Install state: ${result.statePath}`);
      console.log(`Runtime index: ${result.runtimeIndexPath}`);
      const briefPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE);
      if (await exists(briefPath)) {
        const brief = await readJsonFile<OnboardingBrief>(briefPath);
        console.log(formatPostInstallSummary(brief, briefPath));
      } else {
        console.log('Next: npx @harness-forge/cli shell setup --yes | npm install -g @harness-forge/cli');
      }
    });
}
