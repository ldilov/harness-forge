import type { EffectivenessSignalRecord } from "../../infrastructure/observability/local-metrics-store.js";
import type { ConfidenceLevel } from "../../domain/runtime/effectiveness-signal.js";
import type { EffectivenessDimensionId, EffectivenessDimensionScore } from "../../domain/runtime/effectiveness-dimension.js";

interface DimensionRule {
  readonly dimensionId: EffectivenessDimensionId;
  readonly match: (signal: EffectivenessSignalRecord) => boolean;
}

const DIMENSION_RULES: readonly DimensionRule[] = [
  {
    dimensionId: "repoUnderstanding",
    match: (s) =>
      s.category === "install" ||
      /scan|cartograph|recommend/i.test(s.signalType)
  },
  {
    dimensionId: "targetCorrectness",
    match: (s) =>
      /target/i.test(s.signalType) ||
      s.category === "install"
  },
  {
    dimensionId: "runtimeAdoption",
    match: (s) => s.category === "runtimeUsage"
  },
  {
    dimensionId: "maintenanceHygiene",
    match: (s) => s.category === "maintenance"
  },
  {
    dimensionId: "workContinuity",
    match: (s) => s.category === "recursive" || s.category === "handoff"
  },
  {
    dimensionId: "recommendationFollowThrough",
    match: (s) =>
      s.category === "guidance" &&
      (s.result === "accepted" || s.result === "success")
  }
] as const;

function deriveConfidence(signalCount: number): ConfidenceLevel {
  if (signalCount > 5) return "direct";
  if (signalCount > 2) return "inferred-high";
  if (signalCount > 0) return "inferred-medium";
  return "inferred-low";
}

export function scoreEffectivenessDimensions(
  signals: readonly EffectivenessSignalRecord[]
): EffectivenessDimensionScore[] {
  return DIMENSION_RULES.map((rule) => {
    const matched = signals.filter(rule.match);
    const signalCount = matched.length;
    const score = Math.min(100, signalCount * 15);
    const evidence = matched
      .slice(0, 5)
      .map((s) => `${s.signalType}:${s.result}`);

    return {
      dimensionId: rule.dimensionId,
      score,
      evidence,
      confidenceLevel: deriveConfidence(signalCount),
      signalCount
    };
  });
}
