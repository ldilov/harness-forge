import type { DiagnosisResult } from "../../domain/onboarding/diagnosis-result.js";
import type {
  RecommendationBrief,
  RecommendationReason,
  AlternativeRecommendation,
} from "../../domain/onboarding/recommendation-brief.js";
export interface GenerateRecommendationBriefInput {
  readonly diagnosis: DiagnosisResult;
}

export async function generateRecommendationBrief(
  input: GenerateRecommendationBriefInput
): Promise<RecommendationBrief> {
  const { diagnosis } = input;

  const targetRationale: RecommendationReason[] = [];
  const profileRationale: RecommendationReason[] = [];
  const moduleRationale: RecommendationReason[] = [];
  const caveats: string[] = [];
  const alternatives: AlternativeRecommendation[] = [];

  // Determine recommended targets
  const recommendedTargets = deriveTargets(diagnosis, targetRationale);

  // Determine profile
  const recommendedProfile = deriveProfile(diagnosis, profileRationale);

  // Determine modules
  const recommendedModules = deriveModules(diagnosis, moduleRationale);

  // Add caveats
  if (recommendedTargets.includes("codex") && recommendedTargets.includes("claude-code")) {
    caveats.push("Codex and Claude share the canonical runtime but differ in hook/plugin posture.");
  }

  // Add alternatives
  if (recommendedTargets.length > 1) {
    alternatives.push({
      id: "codex-only-minimal",
      summary: "Smaller install footprint if native hook behavior is not needed.",
      targets: ["codex"],
      profile: recommendedProfile,
      modules: recommendedModules.filter((m) => m !== "task-pack-support"),
      tradeOffs: [
        "Claude-native hook posture not installed",
        "Less ready for mixed-tool teams",
      ],
    });
  }

  // Compute confidence
  const targetConfidence = computeTargetConfidence(diagnosis);
  const profileConfidence = diagnosis.confidence >= 0.7 ? 0.83 : 0.6;
  const moduleConfidence = diagnosis.confidence >= 0.5 ? 0.78 : 0.55;
  const overall = Math.min(targetConfidence, profileConfidence, moduleConfidence);

  return {
    generatedAt: new Date().toISOString(),
    root: diagnosis.root,
    repoType: diagnosis.repoType,
    recommendedTargets,
    recommendedProfile,
    recommendedModules,
    rationale: {
      targets: targetRationale,
      profile: profileRationale,
      modules: moduleRationale,
    },
    evidence: diagnosis.topEvidence,
    confidence: {
      targets: targetConfidence,
      profile: profileConfidence,
      modules: moduleConfidence,
      overall,
    },
    caveats,
    alternatives,
  };
}

function deriveTargets(
  diagnosis: DiagnosisResult,
  rationale: RecommendationReason[]
): string[] {
  const { detectedTargets } = diagnosis;

  if (detectedTargets.includes("codex") && detectedTargets.includes("claude-code")) {
    rationale.push({
      id: "existing-target-markers",
      summary: "Existing Codex and Claude target markers were detected.",
      importance: "high",
    });
    rationale.push({
      id: "shared-runtime-value",
      summary: "The repo benefits from a shared hidden runtime with thin target bridges.",
      importance: "high",
    });
    return ["codex", "claude-code"];
  }

  if (detectedTargets.includes("claude-code")) {
    rationale.push({
      id: "existing-claude-marker",
      summary: "Existing Claude Code target marker detected.",
      importance: "high",
    });
    return ["claude-code"];
  }

  if (detectedTargets.includes("codex")) {
    rationale.push({
      id: "existing-codex-marker",
      summary: "Existing Codex target marker detected.",
      importance: "high",
    });
    return ["codex"];
  }

  // No markers — default to codex as bootstrap
  rationale.push({
    id: "bootstrap-default",
    summary: "No prior target markers detected. Codex is the default bootstrap target.",
    importance: "medium",
  });
  return ["codex"];
}

function deriveProfile(
  diagnosis: DiagnosisResult,
  rationale: RecommendationReason[]
): string {
  if (diagnosis.toolingSignals.length >= 2 && diagnosis.confidence >= 0.7) {
    rationale.push({
      id: "repo-complexity",
      summary: "The repo has meaningful runtime and maintenance surfaces.",
      importance: "high",
    });
    return "recommended";
  }

  rationale.push({
    id: "minimal-signals",
    summary: "Limited signals suggest a smaller baseline is safer.",
    importance: "medium",
  });
  return "quick";
}

function deriveModules(
  diagnosis: DiagnosisResult,
  rationale: RecommendationReason[]
): string[] {
  const modules: string[] = [];

  modules.push("export-support");

  if (diagnosis.toolingSignals.length >= 2) {
    modules.push("working-memory");
    rationale.push({
      id: "work-packet-needs",
      summary: "Task-pack and export flows are useful in this workspace.",
      importance: "medium",
    });
  }

  if (diagnosis.frameworkMatches.length > 0 || diagnosis.toolingSignals.length >= 3) {
    modules.push("task-pack-support");
  }

  return modules;
}

function computeTargetConfidence(diagnosis: DiagnosisResult): number {
  if (diagnosis.detectedTargets.length > 0) {
    return Math.min(diagnosis.confidence + 0.1, 1.0);
  }
  return Math.max(diagnosis.confidence - 0.1, 0.3);
}
