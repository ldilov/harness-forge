import type { NextActionPlan } from "../../domain/next/next-action-plan.js";
import type { EvidenceItem } from "../../domain/shared/evidence-item.js";
import type { WorkspaceState } from "../../domain/next/candidate-action.js";
import { collectWorkspaceState } from "./collect-workspace-state.js";
import { buildCandidateActions } from "./build-candidate-actions.js";
import { scoreCandidateActions } from "./score-candidate-actions.js";

export interface RecommendNextActionInput {
  readonly workspaceRoot: string;
}

export async function recommendNextAction(
  input: RecommendNextActionInput
): Promise<NextActionPlan> {
  const state = await collectWorkspaceState({ workspaceRoot: input.workspaceRoot });
  const candidates = buildCandidateActions(state);
  const scored = scoreCandidateActions(candidates, state);

  if (scored.length === 0) {
    return buildFallbackPlan(input.workspaceRoot, state);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const winner = scored[0]!;
  const alternatives = scored.slice(1, 4).map((s) => ({
    actionId: s.action.actionId,
    title: s.action.title,
    command: s.action.command,
    reason: `Score: ${s.score.toFixed(2)}`,
  }));

  const evidence = buildEvidence(state, winner.action.actionId);
  const phase = detectPhase(state);

  return {
    generatedAt: new Date().toISOString(),
    root: input.workspaceRoot,
    phase,
    actionId: winner.action.actionId,
    title: winner.action.title,
    command: winner.action.command,
    summary: buildSummary(winner.action.actionId, state),
    confidence: winner.score,
    safeToAutoApply: winner.action.classification === "safe-auto",
    classification: winner.action.classification,
    evidence,
    blockingConditions: [],
    followUps: alternatives.length > 0
      ? [{ actionId: alternatives[0]!.actionId, title: alternatives[0]!.title, command: alternatives[0]!.command, reason: "Recommended follow-up after primary action." }]
      : [],
    alternatives,
  };
}

function detectPhase(state: WorkspaceState): NextActionPlan["phase"] {
  if (!state.hasInstallState) return "setup";
  if (!state.hasRuntimeIndex || state.doctorStatus === "failure") return "recover";
  if (state.isRuntimeStale || state.doctorStatus === "warning") return "maintain";
  return "operate";
}

function buildEvidence(state: WorkspaceState, _actionId: string): EvidenceItem[] {
  const items: EvidenceItem[] = [];

  if (!state.hasInstallState) {
    items.push({ id: "ev-no-install", label: "No install state", signalType: "runtime-signal", summary: "Workspace has no install state" });
  }
  if (!state.hasRuntimeIndex) {
    items.push({ id: "ev-no-index", label: "Missing runtime index", path: ".hforge/runtime/index.json", signalType: "runtime-signal", summary: "Runtime index is missing" });
  }
  if (state.isRuntimeStale) {
    items.push({ id: "ev-stale", label: "Stale runtime", path: ".hforge/runtime/index.json", signalType: "runtime-signal", summary: "Runtime index is stale" });
  }
  if (state.staleArtifactCount > 0) {
    items.push({ id: "ev-stale-tasks", label: "Stale task artifacts", path: ".hforge/runtime/tasks", signalType: "task-signal", summary: `${state.staleArtifactCount} stale task artifacts detected` });
  }
  if (state.detectedTargets.length > 0) {
    items.push({ id: "ev-targets", label: "Installed targets", signalType: "target-marker", summary: `Installed targets: ${state.detectedTargets.join(", ")}` });
  }

  return items;
}

function buildSummary(actionId: string, state: WorkspaceState): string {
  switch (actionId) {
    case "setup.bootstrap":
      return "Workspace needs initialization. No install state was found.";
    case "recover.fix-missing-runtime-index":
      return "Runtime index is missing. Refresh will rebuild it.";
    case "recover.reconcile-stale-artifacts":
      return `${state.staleArtifactCount} stale artifacts need reconciliation.`;
    case "maintain.refresh-runtime":
      return "Runtime index is stale. Refresh will update it for reliable review/export.";
    case "maintain.run-doctor":
      return "Doctor report indicates issues that should be investigated.";
    case "maintain.review-health":
      return "Workspace is healthy. Review provides a comprehensive health check.";
    default:
      return "This is the most useful action based on current workspace state.";
  }
}

function buildFallbackPlan(root: string, state: WorkspaceState): NextActionPlan {
  return {
    generatedAt: new Date().toISOString(),
    root,
    phase: detectPhase(state),
    actionId: "setup.bootstrap",
    title: "Initialize workspace",
    command: "hforge init --root .",
    summary: "No actionable candidates found. Starting from initialization.",
    confidence: 0.5,
    safeToAutoApply: false,
    classification: "safe-manual",
    evidence: [],
    blockingConditions: [],
    followUps: [],
    alternatives: [],
  };
}
