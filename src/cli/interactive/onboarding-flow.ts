import path from "node:path";

import { generateRecommendationBrief } from "../../application/onboarding/generate-recommendation-brief.js";
import { compareTargets } from "../../application/targets/compare-targets.js";
import { generateDiagnosis } from "../../application/onboarding/generate-diagnosis.js";
import { installHarnessForgeGlobally } from "../../application/install/global-cli-install.js";
import { getShellIntegrationStatus } from "../../application/install/shell-integration.js";
import { presentRecommendationBrief } from "../../infrastructure/presentation/presenters/recommendation-brief-presenter.js";
import { presentTargetComparison } from "../../infrastructure/presentation/presenters/target-comparison-presenter.js";
import type { DiagnosisResult } from "../../domain/onboarding/diagnosis-result.js";
import type { RecommendationBrief } from "../../domain/onboarding/recommendation-brief.js";
import type { TargetComparisonReport } from "../../domain/targets/target-comparison.js";
import type { ReviewSummaryV2 } from "../../domain/review/review-summary-v2.js";
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
import type { TerminalCapabilityProfile } from "./terminal-capabilities.js";
import { recommendSetupDefaults } from "./default-recommendations.js";
import type { OptionalModuleId } from "./setup-intent.js";
import { OPTIONAL_MODULE_LABELS } from "./setup-intent.js";
import { renderReviewSummary } from "./review-summary.js";
import { styleBox, styleEmoji, styleKeyValue, styleProgressBar, styleTreeList } from "./renderers/text-style.js";

export async function runInteractiveOnboarding(startRoot: string): Promise<ExecutionSummary> {
  const capabilities = detectTerminalCapabilities();
  const promptSession = createPromptSession(capabilities);
  const defaults = await recommendSetupDefaults(startRoot);

  console.log(renderWelcomeScreen(capabilities));

  let completed = false;
  let summary: ExecutionSummary | null = null;

  while (!completed) {
    // --- Diagnosis-first steps ---
    const diagnosis = await showDiagnosisStep(startRoot);
    const brief = await generateRecommendationBrief({ diagnosis });
    showRecommendationStep(brief);

    if (brief.recommendedTargets.length >= 2) {
      try {
        const comparison = await compareTargets({
          leftTargetId: brief.recommendedTargets[0]!,
          rightTargetId: brief.recommendedTargets[1]!,
          workspaceRoot: startRoot,
        });
        showTargetDifferencesStep(comparison);
      } catch {
        // Target comparison is best-effort; skip if matrix unavailable
      }
    }

    // --- Configuration steps (pre-populated from recommendation) ---
    const folderSelection = await promptForFolderSelection(promptSession, startRoot);
    const setupRoot = folderSelection.selectionMode === "current-directory" ? startRoot : path.resolve(folderSelection.resolvedPath);
    const targetIds = await promptForTargetSelection(promptSession, brief.recommendedTargets);
    const setupProfile = await promptForSetupProfile(promptSession, brief.recommendedProfile as import("./setup-intent.js").SetupProfileId);
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

// --- Usefulness-first onboarding steps (20260404-0200) ---

export async function showDiagnosisStep(workspaceRoot: string): Promise<DiagnosisResult> {
  const caps = detectTerminalCapabilities();

  // Activity tree
  const spinnerIcon = styleEmoji("\u23F3", caps, "...");
  console.log(`\n  ${spinnerIcon} Inspecting workspace...`);
  console.log(styleTreeList([
    "detecting targets",
    "checking language signals",
    "loading capability truth",
    "building recommendation brief"
  ], caps));
  console.log("");

  const diagnosis = await generateDiagnosis({ workspaceRoot });

  // Build detected box content
  const boxLines = buildDiagnosisBoxLines(diagnosis, caps);
  const titleIcon = styleEmoji("\uD83D\uDD0D", caps, "*");
  console.log(styleBox(boxLines, caps, `${titleIcon} Detected`));
  console.log("");

  return diagnosis;
}

function buildDiagnosisBoxLines(diagnosis: DiagnosisResult, caps: TerminalCapabilityProfile): string[] {
  const lines: string[] = [];

  lines.push(styleKeyValue(
    `${styleEmoji("\uD83D\uDCE6", caps, " ")} Repo type`,
    diagnosis.repoType,
    caps
  ));

  for (const lang of diagnosis.dominantLanguages) {
    lines.push(styleKeyValue(
      `${styleEmoji("\uD83D\uDFE6", caps, " ")} ${lang.language}`,
      `${lang.strength} confidence`,
      caps
    ));
  }

  if (diagnosis.frameworkMatches.length > 0) {
    lines.push(styleKeyValue(
      `${styleEmoji("\uD83D\uDEE0\uFE0F", caps, " ")} Frameworks`,
      diagnosis.frameworkMatches.join(", "),
      caps
    ));
  }

  if (diagnosis.toolingSignals.length > 0) {
    lines.push(styleKeyValue(
      `${styleEmoji("\uD83D\uDD27", caps, " ")} Tooling`,
      diagnosis.toolingSignals.join(", "),
      caps
    ));
  }

  if (diagnosis.detectedTargets.length > 0) {
    lines.push(styleKeyValue(
      `${styleEmoji("\uD83C\uDFAF", caps, " ")} Targets`,
      `${diagnosis.detectedTargets.join(", ")} (existing)`,
      caps
    ));
  }

  const confPercent = Math.round(diagnosis.confidence * 100);
  const confLabel = diagnosis.confidence >= 0.8 ? "High" : diagnosis.confidence >= 0.5 ? "Medium" : "Low";
  lines.push(styleKeyValue(
    `${styleEmoji("\uD83D\uDCCA", caps, " ")} Confidence`,
    `${styleProgressBar(confPercent, 10, caps)} ${confLabel}`,
    caps
  ));

  return lines;
}

export function showRecommendationStep(brief: RecommendationBrief): void {
  const caps = detectTerminalCapabilities();
  console.log(presentRecommendationBrief(brief, "full", caps));
  console.log("");
}

export function showTargetDifferencesStep(comparison: TargetComparisonReport): void {
  console.log(presentTargetComparison(comparison, "embedded"));
  console.log("");
}

export function showChangePlanStep(summary: ReviewSummaryV2): void {
  const caps = detectTerminalCapabilities();
  const titleIcon = styleEmoji("\uD83D\uDCDD", caps, "*");
  const lines: string[] = [];
  for (const change of summary.topChanges) {
    lines.push(`${styleEmoji("\u2022", caps, "-")} ${change.description} (${change.layer})`);
  }
  if (summary.warnings.length > 0) {
    lines.push("");
    lines.push(`${styleEmoji("\u26A0\uFE0F", caps, "!")} Warnings`);
    for (const warning of summary.warnings) {
      lines.push(`  ${styleEmoji("\u2022", caps, "-")} ${warning}`);
    }
  }
  console.log(styleBox(lines, caps, `${titleIcon} What will change`));
  console.log("");
}
