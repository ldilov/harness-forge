import type { CandidateAction, WorkspaceState } from "../../domain/next/candidate-action.js";

export function buildCandidateActions(state: WorkspaceState): CandidateAction[] {
  const allCandidates: CandidateAction[] = [
    {
      actionId: "setup.bootstrap",
      title: "Complete workspace initialization",
      command: "hforge init --root .",
      phase: "setup",
      classification: "safe-manual",
      scoringHints: { urgencyBase: 0.9, healthImpactBase: 0.8, effortReductionBase: 0.9, reversibilityBase: 0.7 },
      checkPrerequisites: (s) => !s.hasInstallState,
    },
    {
      actionId: "setup.finish-shell-integration",
      title: "Complete shell setup",
      command: "hforge shell setup --yes",
      phase: "setup",
      classification: "review-required",
      scoringHints: { urgencyBase: 0.4, healthImpactBase: 0.2, effortReductionBase: 0.6, reversibilityBase: 0.8 },
      checkPrerequisites: (s) => s.hasInstallState && !s.isShellIntegrated,
    },
    {
      actionId: "maintain.refresh-runtime",
      title: "Refresh shared runtime",
      command: "hforge refresh --root .",
      phase: "maintain",
      classification: "safe-auto",
      scoringHints: { urgencyBase: 0.7, healthImpactBase: 0.7, effortReductionBase: 0.6, reversibilityBase: 0.9 },
      checkPrerequisites: (s) => s.hasInstallState && s.isRuntimeStale,
    },
    {
      actionId: "maintain.review-health",
      title: "Review workspace health",
      command: "hforge review --root .",
      phase: "maintain",
      classification: "safe-manual",
      scoringHints: { urgencyBase: 0.5, healthImpactBase: 0.5, effortReductionBase: 0.4, reversibilityBase: 1.0 },
      checkPrerequisites: (s) => s.hasInstallState && s.hasRuntimeIndex,
    },
    {
      actionId: "maintain.run-doctor",
      title: "Run workspace doctor",
      command: "hforge doctor --root .",
      phase: "maintain",
      classification: "safe-manual",
      scoringHints: { urgencyBase: 0.6, healthImpactBase: 0.6, effortReductionBase: 0.3, reversibilityBase: 1.0 },
      checkPrerequisites: (s) => s.hasInstallState && (s.doctorStatus === "warning" || s.doctorStatus === "failure"),
    },
    {
      actionId: "operate.inspect-task",
      title: "Inspect current task runtime",
      command: "hforge task list --root . --json",
      phase: "operate",
      classification: "safe-manual",
      scoringHints: { urgencyBase: 0.3, healthImpactBase: 0.2, effortReductionBase: 0.5, reversibilityBase: 1.0 },
      checkPrerequisites: (s) => s.hasInstallState && s.hasRuntimeIndex && s.hasTaskFolders,
    },
    {
      actionId: "operate.inspect-pack",
      title: "Inspect available packs",
      command: "hforge pack list --root . --json",
      phase: "operate",
      classification: "safe-manual",
      scoringHints: { urgencyBase: 0.2, healthImpactBase: 0.2, effortReductionBase: 0.4, reversibilityBase: 1.0 },
      checkPrerequisites: (s) => s.hasInstallState && s.hasRuntimeIndex && s.hasPacksAvailable,
    },
    {
      actionId: "recover.fix-missing-runtime-index",
      title: "Repair missing runtime index",
      command: "hforge refresh --root .",
      phase: "recover",
      classification: "safe-auto",
      scoringHints: { urgencyBase: 1.0, healthImpactBase: 0.9, effortReductionBase: 0.8, reversibilityBase: 0.9 },
      checkPrerequisites: (s) => s.hasInstallState && !s.hasRuntimeIndex,
    },
    {
      actionId: "recover.reconcile-stale-artifacts",
      title: "Reconcile stale artifacts",
      command: "hforge refresh --root .",
      phase: "recover",
      classification: "safe-auto",
      scoringHints: { urgencyBase: 0.8, healthImpactBase: 0.7, effortReductionBase: 0.6, reversibilityBase: 0.9 },
      checkPrerequisites: (s) => s.hasInstallState && s.staleArtifactCount > 2,
    },
  ];

  return allCandidates.filter((c) => c.checkPrerequisites(state));
}
