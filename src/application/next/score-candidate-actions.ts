import type { CandidateAction, WorkspaceState } from "../../domain/next/candidate-action.js";

export interface ScoredCandidate {
  readonly action: CandidateAction;
  readonly score: number;
  readonly breakdown: {
    readonly urgency: number;
    readonly healthImpact: number;
    readonly phaseFit: number;
    readonly effortReduction: number;
    readonly confidence: number;
    readonly reversibility: number;
  };
}

const WEIGHTS = {
  urgency: 0.30,
  healthImpact: 0.20,
  phaseFit: 0.15,
  effortReduction: 0.15,
  confidence: 0.10,
  reversibility: 0.10,
} as const;

export function scoreCandidateActions(
  candidates: readonly CandidateAction[],
  state: WorkspaceState
): ScoredCandidate[] {
  const currentPhase = detectCurrentPhase(state);

  const scored = candidates.map((action) => {
    const phaseFit = action.phase === currentPhase ? 1.0 : 0.5;
    const confidence = computeActionConfidence(action, state);

    const breakdown = {
      urgency: action.scoringHints.urgencyBase,
      healthImpact: action.scoringHints.healthImpactBase,
      phaseFit,
      effortReduction: action.scoringHints.effortReductionBase,
      confidence,
      reversibility: action.scoringHints.reversibilityBase,
    };

    const score =
      breakdown.urgency * WEIGHTS.urgency +
      breakdown.healthImpact * WEIGHTS.healthImpact +
      breakdown.phaseFit * WEIGHTS.phaseFit +
      breakdown.effortReduction * WEIGHTS.effortReduction +
      breakdown.confidence * WEIGHTS.confidence +
      breakdown.reversibility * WEIGHTS.reversibility;

    return { action, score, breakdown };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function detectCurrentPhase(state: WorkspaceState): string {
  if (!state.hasInstallState) return "setup";
  if (!state.hasRuntimeIndex) return "recover";
  if (state.doctorStatus === "failure") return "recover";
  if (state.isRuntimeStale || state.doctorStatus === "warning") return "maintain";
  return "operate";
}

function computeActionConfidence(action: CandidateAction, state: WorkspaceState): number {
  if (action.phase === "recover" && !state.hasRuntimeIndex) return 0.95;
  if (action.phase === "maintain" && state.isRuntimeStale) return 0.85;
  if (action.phase === "setup" && !state.hasInstallState) return 0.90;
  return 0.70;
}

export function filterSafeAutoOnly(
  candidates: readonly ScoredCandidate[]
): ScoredCandidate[] {
  return candidates.filter((c) => c.action.classification === "safe-auto");
}
