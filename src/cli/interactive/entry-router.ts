import path from "node:path";

import { detectWorkspacePhase, suggestCommandsForPhase } from "../../application/runtime/detect-workspace-phase.js";
import { recommendNextAction } from "../../application/next/recommend-next-action.js";
import { appendGuidanceAdoptionSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { presentNextAction } from "../../infrastructure/presentation/presenters/next-action-presenter.js";
import { RUNTIME_DIR, RUNTIME_REPO_DIR, FIRST_RUN_RESULT_FILE, exists, readJsonFile } from "../../shared/index.js";
import type { FirstRunResult } from "../../domain/runtime/first-run-result.js";
import type { CliInvocationContext } from "./invocation-context.js";
import { resolveInvocationContext } from "./invocation-context.js";
import { runInteractiveOnboarding } from "./onboarding-flow.js";
import { runProjectHub } from "./project-hub.js";

export type DefaultInteractiveRoute = "onboarding" | "project-hub" | "maintain" | "none";

export async function chooseDefaultInteractiveRoute(context: CliInvocationContext): Promise<DefaultInteractiveRoute> {
  if (context.argv.length > 0) {
    return "none";
  }
  if (!context.terminalProfile.supportsInteractiveInput && process.env.HFORGE_FORCE_TTY !== "1") {
    return "none";
  }
  if (context.detectedRuntimeState === "present") {
    // Check if workspace needs maintenance attention
    const phase = await detectWorkspacePhase(context.detectedWorkspaceRoot);
    if (phase === "maintain") {
      return "maintain";
    }
    return "project-hub";
  }
  if (context.detectedRuntimeState === "partial") {
    return "maintain";
  }
  return "onboarding";
}

async function checkGuidanceAdoption(workspaceRoot: string, executedCommand: string): Promise<void> {
  try {
    const resultPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, FIRST_RUN_RESULT_FILE);
    if (!(await exists(resultPath))) {
      return;
    }
    const firstRunResult = await readJsonFile<FirstRunResult>(resultPath);
    if (firstRunResult.primaryNextCommand) {
      await appendGuidanceAdoptionSignal(workspaceRoot, firstRunResult.primaryNextCommand, executedCommand);
    }
  } catch {
    // Best-effort: do not fail the main flow for adoption tracking
  }
}

export async function runDefaultInteractiveEntry(argv: string[], cwd: string): Promise<boolean> {
  const context = await resolveInvocationContext(argv, cwd);
  const executedCommand = argv.join(" ");
  if (executedCommand.length > 0) {
    await checkGuidanceAdoption(context.detectedWorkspaceRoot, `hforge ${executedCommand}`);
  }
  const route = await chooseDefaultInteractiveRoute(context);
  if (route === "none") {
    return false;
  }

  if (route === "maintain") {
    const suggestions = suggestCommandsForPhase("maintain");
    console.log("Workspace needs attention. Suggested maintenance commands:");
    for (const cmd of suggestions) {
      console.log(`  ${cmd}`);
    }
    const result = await runProjectHub(context.detectedWorkspaceRoot);
    console.log(result.operatorMessage);
    return true;
  }

  if (route === "project-hub") {
    const result = await runProjectHub(context.detectedWorkspaceRoot);
    console.log(result.operatorMessage);
    return true;
  }

  await runInteractiveOnboarding(context.detectedWorkspaceRoot);
  return true;
}

export async function showNextSummary(workspaceRoot: string): Promise<void> {
  const plan = await recommendNextAction({ workspaceRoot });
  console.log(presentNextAction(plan, false));
}
