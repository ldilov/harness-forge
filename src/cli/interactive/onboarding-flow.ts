import path from "node:path";

import { installHarnessForgeGlobally } from "../../application/install/global-cli-install.js";
import { getShellIntegrationStatus } from "../../application/install/shell-integration.js";
import { createRecoveryNotice } from "./recovery-notices.js";
import { applySetupIntent, buildReviewPlan } from "./review-plan.js";
import { createPromptSession } from "./prompt-io.js";
import { renderChoiceList } from "./renderers/choice-list.js";
import { renderCompletionScreen } from "./renderers/completion-screen.js";
import { renderStepFrame } from "./renderers/step-frame.js";
import { renderWelcomeScreen } from "./renderers/welcome-screen.js";
import { promptForFolderSelection } from "./prompts/folder-selection.js";
import { promptForModules } from "./prompts/module-selection.js";
import { promptForSetupProfile } from "./prompts/setup-profile.js";
import { promptForTargetSelection } from "./prompts/target-selection.js";
import type { ExecutionSummary } from "./session-state.js";
import { detectTerminalCapabilities } from "./terminal-capabilities.js";
import { recommendSetupDefaults } from "./default-recommendations.js";
import type { OptionalModuleId } from "./setup-intent.js";
import { OPTIONAL_MODULE_LABELS } from "./setup-intent.js";
import { renderReviewSummary } from "./review-summary.js";

export async function runInteractiveOnboarding(startRoot: string): Promise<ExecutionSummary> {
  const capabilities = detectTerminalCapabilities();
  const promptSession = createPromptSession(capabilities);
  const defaults = await recommendSetupDefaults(startRoot);

  console.log(renderWelcomeScreen(capabilities));

  let completed = false;
  let summary: ExecutionSummary | null = null;

  while (!completed) {
    const folderSelection = await promptForFolderSelection(promptSession, startRoot);
    const setupRoot = folderSelection.selectionMode === "current-directory" ? startRoot : path.resolve(folderSelection.resolvedPath);
    const targetIds = await promptForTargetSelection(promptSession, defaults.recommendedTargets);
    const setupProfile = await promptForSetupProfile(promptSession, defaults.recommendedProfile);
    const enabledModules = await promptForModules(promptSession, setupProfile);
    const dryRun = await promptSession.askConfirm("dryRun", "Preview only without writing files", false);

    console.log(
      renderStepFrame(
        capabilities,
        "Folder selection",
        1,
        4,
        `Workspace root: ${setupRoot}\nMode: ${folderSelection.selectionMode}`
      )
    );
    console.log(
      renderStepFrame(
        capabilities,
        "Target selection",
        2,
        4,
        renderChoiceList(["codex", "claude-code", "cursor", "opencode"], targetIds)
      )
    );
    console.log(
      renderStepFrame(
        capabilities,
        "Setup profile",
        3,
        4,
        `Profile: ${setupProfile}\nModules: ${enabledModules.map((item) => OPTIONAL_MODULE_LABELS[item]).join(", ") || "none"}`
      )
    );

    const reviewPlan = await buildReviewPlan({
      workspaceRoot: setupRoot,
      folderSelection,
      targetIds,
      setupProfile,
      enabledModules: enabledModules as OptionalModuleId[],
      recommendedTargetIds: defaults.recommendedTargets,
      dryRun,
      applyChanges: !dryRun,
      source: "interactive"
    });
    console.log(renderReviewSummary(reviewPlan, capabilities));

    const confirmAction = await promptSession.askChoice(
      "confirmAction",
      "Confirm setup",
      ["confirm", "back", "cancel"],
      "confirm"
    );

    if (confirmAction === "back") {
      continue;
    }
    if (confirmAction === "cancel") {
      return {
        status: "cancelled",
        workspaceRoot: setupRoot,
        appliedTargets: [],
        writtenArtifacts: [],
        preservedArtifacts: [],
        nextSuggestedCommands: [],
        importantPaths: [],
        operatorMessage: createRecoveryNotice("cancelled", "Setup cancelled before apply.", setupRoot).summary
      };
    }

    summary = await applySetupIntent({
      workspaceRoot: setupRoot,
      folderSelection,
      targetIds,
      setupProfile,
      enabledModules: enabledModules as OptionalModuleId[],
      recommendedTargetIds: defaults.recommendedTargets,
      dryRun,
      applyChanges: !dryRun,
      source: "interactive"
    });

    if (summary.status === "success" && !dryRun) {
      const shellStatus = await getShellIntegrationStatus();
      if (!shellStatus.bareHforgeResolvable) {
        const globalInstallAction = await promptSession.askChoice(
          "globalInstallAction",
          "Harness Forge is not available as a global command yet. Install the published package globally with npm now?",
          [
            {
              value: "skip",
              label: "Skip (Recommended)",
              description: "Keep using the workspace launcher or run shell setup later."
            },
            {
              value: "install-global",
              label: "Install globally",
              description: "Run npm install -g @harness-forge/cli now."
            }
          ],
          "skip"
        );

        if (globalInstallAction === "install-global") {
          const installResult = installHarnessForgeGlobally();
          if (installResult.succeeded) {
            summary.operatorMessage = `${summary.operatorMessage} Global npm install completed.`;
            summary.nextSuggestedCommands = summary.nextSuggestedCommands.filter(
              (command) => command !== "npm install -g @harness-forge/cli"
            );
            summary.nextSuggestedCommands.unshift("hforge --help");
          } else {
            summary.operatorMessage = `${summary.operatorMessage} Global npm install failed; keep using the workspace launcher or run shell setup.`;
          }
        }
      }
    }
    completed = true;
  }

  if (!summary) {
    throw new Error("Interactive onboarding did not produce a summary.");
  }

  console.log(renderCompletionScreen(summary, capabilities));
  return summary;
}
