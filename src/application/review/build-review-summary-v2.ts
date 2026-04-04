import type { ReviewSummaryV2, ReviewChangeItem } from "../../domain/review/review-summary-v2.js";
import type { RecommendationBrief } from "../../domain/onboarding/recommendation-brief.js";

export interface BuildReviewSummaryV2Input {
  readonly workspaceRoot: string;
  readonly recommendation: RecommendationBrief;
  readonly targetDifferences: readonly string[];
  readonly plannedWrites: readonly PlannedWrite[];
}

export interface PlannedWrite {
  readonly path: string;
  readonly kind: "create" | "update" | "preserve" | "delete" | "unknown";
  readonly description: string;
}

export async function buildReviewSummaryV2(
  input: BuildReviewSummaryV2Input
): Promise<ReviewSummaryV2> {
  const { workspaceRoot, recommendation, targetDifferences, plannedWrites } = input;

  const classifiedChanges: ReviewChangeItem[] = plannedWrites.map((w) => ({
    path: w.path,
    kind: w.kind,
    description: w.description,
    layer: classifyLayer(w.path),
  }));

  const topChanges = selectTopChanges(classifiedChanges);

  const why = recommendation.rationale.targets
    .map((r) => r.summary)
    .concat(recommendation.rationale.profile.map((r) => r.summary));

  const warnings = recommendation.caveats.slice();

  const directCommandPreview = buildCommandPreview(recommendation);

  return {
    generatedAt: new Date().toISOString(),
    workspaceRoot,
    recommendedInstall: {
      targets: [...recommendation.recommendedTargets],
      profile: recommendation.recommendedProfile,
      modules: [...recommendation.recommendedModules],
    },
    why,
    targetDifferences: [...targetDifferences],
    topChanges,
    warnings,
    fullWritePlan: classifiedChanges,
    directCommandPreview,
  };
}

function classifyLayer(filePath: string): ReviewChangeItem["layer"] {
  if (filePath.startsWith(".hforge/runtime/") || filePath.startsWith(".hforge/library/")) {
    return "canonical-runtime";
  }
  if (filePath.startsWith(".hforge/generated/")) {
    return "generated";
  }
  if (filePath.startsWith(".hforge/state/")) {
    return "state";
  }
  if (
    filePath.startsWith(".codex") ||
    filePath.startsWith(".claude") ||
    filePath.startsWith(".agents/") ||
    filePath.startsWith(".specify/") ||
    filePath === "AGENTS.md" ||
    filePath === "CLAUDE.md"
  ) {
    return "target-bridge";
  }
  return "unknown";
}

function selectTopChanges(changes: readonly ReviewChangeItem[]): ReviewChangeItem[] {
  const layerPriority: Record<string, number> = {
    "canonical-runtime": 1,
    "target-bridge": 2,
    "generated": 3,
    "state": 4,
    "unknown": 5,
  };

  const sorted = [...changes].sort(
    (a, b) => (layerPriority[a.layer] ?? 99) - (layerPriority[b.layer] ?? 99)
  );

  return sorted.slice(0, 5);
}

function buildCommandPreview(rec: RecommendationBrief): string {
  const targets = rec.recommendedTargets.join(",");
  return `hforge init --root . --targets ${targets} --setup-profile ${rec.recommendedProfile}`;
}
